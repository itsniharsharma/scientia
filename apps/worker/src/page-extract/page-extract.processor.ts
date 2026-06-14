import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, DelayedError } from 'bullmq';
import { QueueName, PageStatus, ExtractionStatus, QUEUE_CONCURRENCY } from '@scientia/shared';
import type { PageExtractJobData } from '@scientia/shared';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../database/prisma.service';
import { R2Service } from '../storage/r2.service';
import { PromptBuilderService } from './prompt-builder.service';
import { GeminiClientService, GeminiRateLimitError, GeminiSafetyBlockError } from './gemini-client.service';
import { ExtractionValidatorService } from './extraction-validator.service';
import { ExtractionPersistenceService } from './extraction-persistence.service';

const SEQUENTIAL_PAGE_DELAY_MS = 5_000;
const RATE_LIMIT_DELAY_MS = 65_000; // 65s — clears a 60-RPM window

@Processor(QueueName.PageExtract, { concurrency: QUEUE_CONCURRENCY[QueueName.PageExtract] })
export class PageExtractProcessor extends WorkerHost {
  private readonly logger = new Logger(PageExtractProcessor.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly r2: R2Service,
    private readonly promptBuilder: PromptBuilderService,
    private readonly geminiClient: GeminiClientService,
    private readonly validator: ExtractionValidatorService,
    private readonly persistence: ExtractionPersistenceService,
  ) {
    super();
  }

  async process(job: Job<PageExtractJobData>, token?: string): Promise<void> {
    const { pdfId, pdfPageId, pageNumber, r2Key, organizationId, promptVersion } = job.data;

    this.logger.log(`[job ${job.id}] page:extract pdf=${pdfId} page=${pageNumber}`);

    // ── Idempotency: skip already-completed or terminal-invalid pages ─────────
    const existing = await this.prisma.rawPageExtraction.findUnique({
      where: { pdfId_pageNumber: { pdfId, pageNumber } },
      select: { extractionStatus: true },
    });

    if (
      existing?.extractionStatus === ExtractionStatus.Completed ||
      existing?.extractionStatus === ExtractionStatus.InvalidResponse
    ) {
      this.logger.log(
        `[job ${job.id}] page ${pageNumber} already at ${existing.extractionStatus} — skipping`,
      );
      return;
    }

    // ── Sequential guard: wait for page N-1 to complete first ────────────────
    if (pageNumber > 1) {
      const prev = await this.prisma.rawPageExtraction.findUnique({
        where: { pdfId_pageNumber: { pdfId, pageNumber: pageNumber - 1 } },
        select: { extractionStatus: true },
      });

      if (!prev || prev.extractionStatus !== ExtractionStatus.Completed) {
        this.logger.debug(
          `[job ${job.id}] page ${pageNumber} waiting for page ${pageNumber - 1} ` +
            `(current: ${prev?.extractionStatus ?? 'not_started'})`,
        );
        await job.moveToDelayed(Date.now() + SEQUENTIAL_PAGE_DELAY_MS, token);
        throw new DelayedError(`Waiting for page ${pageNumber - 1}`);
      }
    }

    // ── Mark extraction as processing ────────────────────────────────────────
    const persistParams = { pdfId, pdfPageId, pageNumber, organizationId, r2Key, promptVersion };
    await this.persistence.upsertProcessing(persistParams);
    await this.prisma.pdfPage.update({
      where: { id: pdfPageId },
      data: { status: PageStatus.Extracting },
    });

    try {
      // ── Download page image ────────────────────────────────────────────────
      await job.log(`[page ${pageNumber}] Downloading page image from R2`);
      const imageBuffer = await this.r2.download(r2Key);

      // ── Build prompt with visual + passage manifests ───────────────────────
      await job.log(`[page ${pageNumber}] Building prompt (${promptVersion})`);
      const { systemPrompt, userPrompt } = await this.promptBuilder.build(
        pdfId,
        pageNumber,
        promptVersion,
      );

      // ── Call Gemini ────────────────────────────────────────────────────────
      await job.log(`[page ${pageNumber}] Calling Gemini`);
      const geminiResult = await this.geminiClient.extract({
        imageBuffer,
        systemPrompt,
        userPrompt,
        pageNumber,
      });

      const costUsd = this.computeCost(geminiResult.inputTokens, geminiResult.outputTokens);

      // ── Validate JSON contract ────────────────────────────────────────────
      const validation = this.validator.validate(geminiResult.text);

      if (!validation.success) {
        await job.log(`[page ${pageNumber}] Invalid Gemini response: ${validation.error}`);
        await this.persistence.upsertInvalidResponse({
          ...persistParams,
          rawResponse: geminiResult.text,
          errorMessage: validation.error,
          modelVersion: geminiResult.modelVersion,
          inputTokens: geminiResult.inputTokens,
          outputTokens: geminiResult.outputTokens,
          estimatedCostUsd: costUsd,
          processingDurationMs: geminiResult.durationMs,
        });
        await this.prisma.pdfPage.update({
          where: { id: pdfPageId },
          data: { status: PageStatus.Failed },
        });
        // invalid_response is deterministic — don't throw, don't retry
        return;
      }

      // ── Persist successful extraction ─────────────────────────────────────
      await this.persistence.upsertCompleted({
        ...persistParams,
        rawResponse: geminiResult.text,
        normalized: validation.data,
        modelVersion: geminiResult.modelVersion,
        inputTokens: geminiResult.inputTokens,
        outputTokens: geminiResult.outputTokens,
        estimatedCostUsd: costUsd,
        processingDurationMs: geminiResult.durationMs,
        extractionConfidence: validation.data.overall_confidence,
      });

      await this.prisma.pdfPage.update({
        where: { id: pdfPageId },
        data: { status: PageStatus.Extracted },
      });

      await this.prisma.pdf.update({
        where: { id: pdfId },
        data: { pagesExtractedCount: { increment: 1 } },
      });

      await job.log(
        `[page ${pageNumber}] Done — ${validation.data.questions.length} question(s), ` +
          `confidence=${validation.data.overall_confidence.toFixed(2)}, cost=$${costUsd.toFixed(6)}`,
      );

      this.logger.log(
        `[job ${job.id}] page ${pageNumber} extracted — ` +
          `${validation.data.questions.length} question(s)`,
      );
    } catch (err) {
      // ── Rate limit: delay and let BullMQ retry ────────────────────────────
      if (err instanceof GeminiRateLimitError) {
        this.logger.warn(`[job ${job.id}] Gemini rate limit on page ${pageNumber} — delaying`);
        await job.moveToDelayed(Date.now() + RATE_LIMIT_DELAY_MS, token);
        throw new DelayedError('Gemini rate limited');
      }

      // ── Safety block: terminal, save and don't retry ──────────────────────
      if (err instanceof GeminiSafetyBlockError) {
        await this.persistence.upsertInvalidResponse({
          ...persistParams,
          rawResponse: null,
          errorMessage: 'Gemini safety block',
          modelVersion: this.config.get('GEMINI_MODEL'),
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: 0,
          processingDurationMs: 0,
        });
        await this.prisma.pdfPage.update({
          where: { id: pdfPageId },
          data: { status: PageStatus.Failed },
        });
        return;
      }

      // ── Retryable error: mark failed on final attempt ─────────────────────
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[job ${job.id}] page ${pageNumber} failed: ${errMsg}`,
        err instanceof Error ? err.stack : undefined,
      );

      const maxAttempts = job.opts.attempts ?? 1;
      if (job.attemptsMade + 1 >= maxAttempts) {
        await this.persistence.upsertFailed({ ...persistParams, errorMessage: errMsg });
        await this.prisma.pdfPage
          .update({ where: { id: pdfPageId }, data: { status: PageStatus.Failed } })
          .catch(() => undefined);
      }

      throw err;
    }
  }

  private computeCost(inputTokens: number, outputTokens: number): number {
    const inputCost = this.config.get('GEMINI_INPUT_COST_PER_1M');
    const outputCost = this.config.get('GEMINI_OUTPUT_COST_PER_1M');
    return (inputTokens / 1_000_000) * inputCost + (outputTokens / 1_000_000) * outputCost;
  }
}
