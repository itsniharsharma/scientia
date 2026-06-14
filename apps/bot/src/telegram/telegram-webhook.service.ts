import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { R2Service } from '../storage/r2.service';
import { PdfIngestProducerService } from '../queue/pdf-ingest-producer.service';
import { AuditService } from '../audit/audit.service';
import { TelegramClientService, TELEGRAM_MAX_FILE_BYTES } from './telegram-client.service';
import { AppConfigService } from '../config/app-config.service';
import { PdfSource, PdfStatus, R2_FOLDERS, STUCK_PDF_THRESHOLD_MINUTES } from '@scientia/shared';
import type { TelegramUpdate } from './types';

const PDF_MIME_TYPE = 'application/pdf';

@Injectable()
export class TelegramWebhookService {
  private readonly logger = new Logger(TelegramWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramClient: TelegramClientService,
    private readonly r2: R2Service,
    private readonly producer: PdfIngestProducerService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
  ) {}

  // ── Public entry point ────────────────────────────────────────────────────

  async handle(update: TelegramUpdate): Promise<void> {
    const message = update.message;

    // Ignore everything that isn't a plain message (edited, channel posts, etc.)
    if (!message) return;

    // Ignore messages from groups other than the configured one
    if (String(message.chat.id) !== this.config.get('TELEGRAM_GROUP_ID')) return;

    // Ignore messages with no document attachment
    if (!message.document) return;

    const { document } = message;
    const chatId = message.chat.id;
    const messageId = message.message_id;
    const senderName = message.from?.username ?? message.from?.first_name ?? 'unknown';

    this.logger.log(
      `Document from ${senderName}: "${document.file_name ?? 'unnamed'}" ` +
        `(mime: ${document.mime_type ?? 'none'}, size: ${document.file_size ?? '?'} bytes)`,
    );

    // ── Early rejections (non-retryable; reply and return) ────────────────

    if (document.mime_type !== PDF_MIME_TYPE) {
      await this.telegramClient.sendMessage(
        chatId,
        `Only PDF files are accepted. Received: ${document.mime_type ?? 'unknown type'}`,
        messageId,
      );
      return;
    }

    const fileSize = document.file_size ?? 0;
    if (fileSize > TELEGRAM_MAX_FILE_BYTES) {
      const sizeMb = (fileSize / 1024 / 1024).toFixed(1);
      await this.telegramClient.sendMessage(
        chatId,
        `PDF too large (${sizeMb} MB). Maximum downloadable size via Telegram Bot API is 20 MB.`,
        messageId,
      );
      return;
    }

    // ── Ingestion ─────────────────────────────────────────────────────────

    try {
      await this.ingest({
        chatId,
        messageId,
        fileId: document.file_id,
        filename: document.file_name ?? 'upload.pdf',
        fileSize,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'internal error';
      this.logger.error('Ingestion failed', err instanceof Error ? err.stack : String(err));

      // Best-effort reply — never throw from here, Telegram must always receive 200
      await this.telegramClient
        .sendMessage(chatId, `Failed to process "${document.file_name ?? 'PDF'}": ${msg}. Please try again.`, messageId)
        .catch((replyErr: unknown) =>
          this.logger.error('Could not send error reply to Telegram', String(replyErr)),
        );
    }
  }

  // ── Ingestion pipeline ────────────────────────────────────────────────────

  private async ingest(params: {
    chatId: number;
    messageId: number;
    fileId: string;
    filename: string;
    fileSize: number;
  }): Promise<void> {
    const { chatId, messageId, fileId, filename, fileSize } = params;

    // Step 1 — Download from Telegram
    this.logger.log(`[1/7] Downloading ${fileId} from Telegram`);
    const telegramFile = await this.telegramClient.getFile(fileId);

    if (!telegramFile.file_path) {
      throw new Error('Telegram returned file metadata with no file_path');
    }

    const fileBuffer = await this.telegramClient.downloadFile(telegramFile.file_path);
    this.logger.log(`[1/7] Downloaded ${fileBuffer.length} bytes`);

    // Step 2 — SHA256
    const sha256 = createHash('sha256').update(fileBuffer).digest('hex');
    this.logger.log(`[2/7] SHA256: ${sha256}`);

    // Step 3 — Load organization (single default org in Phase 2)
    const org = await this.prisma.organization.findFirstOrThrow({
      where: { slug: 'default', isActive: true },
      select: { id: true, name: true },
    });

    // Step 4 — Duplicate / stuck-record check
    this.logger.log(`[3/7] Checking for duplicate: ${sha256}`);
    const existing = await this.prisma.pdf.findUnique({
      where: { sha256Hash: sha256 },
      select: { id: true, originalFilename: true, createdAt: true, status: true, r2Key: true },
    });

    if (existing) {
      // A record in a pre-processing state for longer than the threshold is
      // stuck — the queue job was lost (bot crashed after pdf.create but before
      // queue.add, or BullMQ lost the job). Re-enqueue using the deterministic
      // jobId; BullMQ deduplicates if the job still exists.
      const stuckStatuses: PdfStatus[] = [
        PdfStatus.Uploaded,
        PdfStatus.Queued,
        PdfStatus.Processing,
      ];
      const ageMs = Date.now() - existing.createdAt.getTime();
      const isStuck =
        stuckStatuses.includes(existing.status as PdfStatus) &&
        ageMs > STUCK_PDF_THRESHOLD_MINUTES * 60 * 1000;

      if (isStuck) {
        this.logger.warn(
          `[3/7] Stuck pdf detected (id: ${existing.id}, status: ${existing.status}, age: ${Math.round(ageMs / 60_000)}min) — re-enqueueing`,
        );

        await this.producer.enqueue({
          pdfId: existing.id,
          r2Key: existing.r2Key,
          sha256,
          organizationId: org.id,
        });

        await this.prisma.pdf.update({
          where: { id: existing.id },
          data: { status: PdfStatus.Queued },
        });

        await this.telegramClient.sendMessage(
          chatId,
          `PDF "${existing.originalFilename}" was stuck in processing and has been re-queued.`,
          messageId,
        );
        return;
      }

      // True duplicate — PDF is completed or being processed normally
      this.logger.warn(`[3/7] Duplicate detected — existing pdf.id: ${existing.id}`);

      await this.audit.log({
        action: 'pdf.duplicate_rejected',
        entityType: 'pdf',
        entityId: existing.id,
        payload: {
          sha256,
          telegramMessageId: String(messageId),
          filename,
          sizeBytes: fileSize,
          existingFilename: existing.originalFilename,
          existingCreatedAt: existing.createdAt.toISOString(),
          existingStatus: existing.status,
        },
      });

      await this.telegramClient.sendMessage(
        chatId,
        `Duplicate PDF skipped.\n"${filename}" matches "${existing.originalFilename}" already uploaded on ${existing.createdAt.toLocaleDateString()}.`,
        messageId,
      );
      return;
    }

    // Step 5 — Upload to R2
    const r2Key = `${R2_FOLDERS.PDFS}/${org.id}/${sha256}.pdf`;
    this.logger.log(`[4/7] Uploading to R2: ${r2Key}`);
    await this.r2.uploadPdf(r2Key, fileBuffer, PDF_MIME_TYPE);
    this.logger.log(`[4/7] R2 upload complete`);

    // Step 6 — Create PDF record
    this.logger.log(`[5/7] Creating PDF record`);
    const pdf = await this.prisma.pdf.create({
      data: {
        organizationId: org.id,
        sha256Hash: sha256,
        originalFilename: filename,
        r2Key,
        sizeBytes: BigInt(fileSize || fileBuffer.length),
        source: PdfSource.Telegram,
        telegramMessageId: String(messageId),
        status: PdfStatus.Uploaded,
      },
      select: { id: true },
    });
    this.logger.log(`[5/7] PDF record created: ${pdf.id}`);

    // Step 7 — Enqueue pdf:ingest job, then mark queued
    this.logger.log(`[6/7] Enqueueing pdf:ingest job`);
    await this.producer.enqueue({
      pdfId: pdf.id,
      r2Key,
      sha256,
      organizationId: org.id,
    });
    // Update status after confirmed enqueue; if this update fails the record
    // remains 'uploaded' — Fix #1's stuck-record detection recovers it.
    await this.prisma.pdf.update({
      where: { id: pdf.id },
      data: { status: PdfStatus.Queued },
    });
    this.logger.log(`[6/7] Job enqueued, status → queued`);

    // Step 8 — Audit log
    await this.audit.log({
      action: 'pdf.uploaded',
      entityType: 'pdf',
      entityId: pdf.id,
      payload: {
        sha256,
        telegramMessageId: String(messageId),
        filename,
        sizeBytes: fileSize,
        r2Key,
        organizationId: org.id,
      },
    });

    // Step 9 — Acknowledge to teacher
    this.logger.log(`[7/7] Sending confirmation to chat ${chatId}`);
    await this.telegramClient.sendMessage(
      chatId,
      `PDF queued for processing.\nFile: ${filename}\nSize: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB\nID: ${pdf.id.slice(0, 8)}…`,
      messageId,
    );
  }
}
