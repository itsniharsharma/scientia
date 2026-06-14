import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  QueueName,
  PdfStatus,
  R2_FOLDERS,
  QUEUE_CONCURRENCY,
  GEMINI_PROMPT_VERSION,
} from '@scientia/shared';
import type { PdfIngestJobData } from '@scientia/shared';
import { PrismaService } from '../database/prisma.service';
import { R2Service } from '../storage/r2.service';
import { PdfConverterService } from './pdf-converter.service';
import { PageExtractProducerService } from '../page-extract/page-extract-producer.service';

@Processor(QueueName.PdfIngest, { concurrency: QUEUE_CONCURRENCY[QueueName.PdfIngest] })
export class PdfIngestProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfIngestProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2Service,
    private readonly converter: PdfConverterService,
    private readonly pageExtractProducer: PageExtractProducerService,
  ) {
    super();
  }

  async process(job: Job<PdfIngestJobData>): Promise<void> {
    const { pdfId, r2Key } = job.data;

    this.logger.log(`[job ${job.id}] Starting pdf:ingest for pdf ${pdfId}`);

    // ── Idempotency guard ────────────────────────────────────────────────────
    // If this job somehow runs twice (duplicate enqueue despite deterministic
    // jobId), skip silently rather than re-uploading and duplicating records.
    const existing = await this.prisma.pdf.findUniqueOrThrow({
      where: { id: pdfId },
      select: { id: true, status: true },
    });

    if (
      existing.status === PdfStatus.ReadyForExtraction ||
      existing.status === PdfStatus.ExtractionInProgress ||
      existing.status === PdfStatus.Completed
    ) {
      this.logger.log(`[job ${job.id}] pdf ${pdfId} already at ${existing.status} — skipping`);
      return;
    }

    // ── Mark processing ───────────────────────────────────────────────────────
    await this.prisma.pdf.update({
      where: { id: pdfId },
      data: { status: PdfStatus.Processing, processingStartedAt: new Date() },
    });

    try {
      // ── Step 1: Download PDF from R2 ────────────────────────────────────────
      await job.log(`[1/4] Downloading PDF from R2: ${r2Key}`);
      const pdfBuffer = await this.r2.downloadPdf(r2Key);
      this.logger.log(`[job ${job.id}] [1/4] Downloaded ${pdfBuffer.length} bytes`);

      // ── Step 2: Convert PDF pages to JPEG images ────────────────────────────
      await job.log(`[2/4] Converting PDF to page images`);
      const pages = await this.converter.convertToImages(pdfBuffer);
      const pageCount = pages.length;
      this.logger.log(`[job ${job.id}] [2/4] Converted ${pageCount} page(s)`);

      // Write pageCount to DB as soon as we know it so that crash recovery
      // during the upload loop has the total count available.
      await this.prisma.pdf.update({
        where: { id: pdfId },
        data: { pageCount },
      });

      // ── Step 3: Upload page images + create pdf_pages records ───────────────
      await job.log(`[3/4] Uploading ${pageCount} page image(s) to R2`);

      for (const page of pages) {
        const pageR2Key =
          `${R2_FOLDERS.PAGE_IMAGES}/${pdfId}/page-${String(page.pageNumber).padStart(4, '0')}.jpg`;

        // R2 upload — idempotent (same key = overwrite of same content)
        await this.r2.uploadPage(pageR2Key, page.imageBuffer, 'image/jpeg');

        // DB record — upsert so a crashed+restarted job doesn't create duplicates
        await this.prisma.pdfPage.upsert({
          where: { pdfId_pageNumber: { pdfId, pageNumber: page.pageNumber } },
          create: {
            pdfId,
            pageNumber: page.pageNumber,
            r2Key: pageR2Key,
            widthPx: page.width,
            heightPx: page.height,
          },
          update: {},
        });

        this.logger.debug(
          `[job ${job.id}] Page ${page.pageNumber}/${pageCount} uploaded: ${pageR2Key}`,
        );
      }

      // ── Step 4: Mark ready for extraction ───────────────────────────────────
      await job.log(`[4/5] Marking PDF as ready_for_extraction`);
      await this.prisma.pdf.update({
        where: { id: pdfId },
        data: {
          status: PdfStatus.ReadyForExtraction,
          processingCompletedAt: new Date(),
        },
      });

      // ── Step 5: Enqueue page:extract jobs ───────────────────────────────────
      await job.log(`[5/5] Enqueueing ${pageCount} page:extract job(s)`);

      const pdfPages = await this.prisma.pdfPage.findMany({
        where: { pdfId },
        select: { id: true, pageNumber: true, r2Key: true, widthPx: true, heightPx: true },
        orderBy: { pageNumber: 'asc' },
      });

      for (const page of pdfPages) {
        await this.pageExtractProducer.enqueue({
          pdfId,
          pdfPageId: page.id,
          pageNumber: page.pageNumber,
          r2Key: page.r2Key,
          imageDimensions: { width: page.widthPx ?? 1200, height: page.heightPx ?? 1600 },
          organizationId: job.data.organizationId,
          promptVersion: GEMINI_PROMPT_VERSION,
        });
      }

      await this.prisma.pdf.update({
        where: { id: pdfId },
        data: { status: PdfStatus.ExtractionInProgress },
      });

      this.logger.log(
        `[job ${job.id}] pdf ${pdfId} → extraction_in_progress (${pageCount} page(s) queued)`,
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[job ${job.id}] pdf ${pdfId} failed: ${errMsg}`, err instanceof Error ? err.stack : undefined);

      // Mark failed only on the final attempt so intermediate failures leave
      // the PDF in 'processing' and BullMQ retries normally.
      const maxAttempts = job.opts.attempts ?? 1;
      if (job.attemptsMade + 1 >= maxAttempts) {
        await this.prisma.pdf
          .update({
            where: { id: pdfId },
            data: { status: PdfStatus.Failed, errorMessage: errMsg },
          })
          .catch((dbErr: unknown) =>
            this.logger.error(
              `[job ${job.id}] Failed to write failed status to DB`,
              String(dbErr),
            ),
          );
      }

      throw err;
    }
  }
}
