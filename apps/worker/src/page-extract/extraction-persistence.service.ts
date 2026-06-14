import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ExtractionStatus } from '@scientia/shared';
import type { PageExtractionContract } from './types/extraction-contract';

// Safely coerce a value to Prisma.InputJsonValue (Prisma Json field input).
// Plain objects, strings, numbers, booleans, and arrays are all valid JSON values.
function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export interface PersistProcessingParams {
  pdfId: string;
  pdfPageId: string;
  pageNumber: number;
  organizationId: string;
  r2Key: string;
  promptVersion: string;
}

export interface PersistCompletedParams extends PersistProcessingParams {
  rawResponse: string;
  normalized: PageExtractionContract;
  modelVersion: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  processingDurationMs: number;
  extractionConfidence: number;
}

export interface PersistInvalidResponseParams extends PersistProcessingParams {
  rawResponse: string | null;
  errorMessage: string;
  modelVersion: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  processingDurationMs: number;
}

export interface PersistFailedParams extends PersistProcessingParams {
  errorMessage: string;
}

@Injectable()
export class ExtractionPersistenceService {
  private readonly logger = new Logger(ExtractionPersistenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertProcessing(params: PersistProcessingParams): Promise<void> {
    const { pdfId, pdfPageId, pageNumber, organizationId, r2Key, promptVersion } = params;

    await this.prisma.rawPageExtraction.upsert({
      where: { pdfId_pageNumber: { pdfId, pageNumber } },
      create: {
        pdfId,
        pdfPageId,
        pageNumber,
        organizationId,
        pageImageR2Key: r2Key,
        promptVersion,
        extractionStatus: ExtractionStatus.Processing,
        processingAttempts: 1,
      },
      update: {
        extractionStatus: ExtractionStatus.Processing,
        processingAttempts: { increment: 1 },
        errorMessage: null,
      },
    });
  }

  async upsertCompleted(params: PersistCompletedParams): Promise<void> {
    const {
      pdfId, pdfPageId, pageNumber, organizationId, r2Key, promptVersion,
      rawResponse, normalized, modelVersion,
      inputTokens, outputTokens, estimatedCostUsd, processingDurationMs, extractionConfidence,
    } = params;

    // rawResponse is a JSON string from Gemini — parse it to store as a JSON object
    const parsedResponse = JSON.parse(rawResponse) as Record<string, unknown>;

    await this.prisma.rawPageExtraction.upsert({
      where: { pdfId_pageNumber: { pdfId, pageNumber } },
      create: {
        pdfId,
        pdfPageId,
        pageNumber,
        organizationId,
        pageImageR2Key: r2Key,
        promptVersion,
        modelVersion,
        extractionStatus: ExtractionStatus.Completed,
        rawGeminiResponse: toJson(parsedResponse),
        normalizedExtraction: toJson(normalized),
        inputTokens,
        outputTokens,
        estimatedCostUsd: new Prisma.Decimal(estimatedCostUsd.toFixed(8)),
        processingDurationMs,
        extractionConfidence,
        processingAttempts: 1,
        extractedAt: new Date(),
      },
      update: {
        extractionStatus: ExtractionStatus.Completed,
        rawGeminiResponse: toJson(parsedResponse),
        normalizedExtraction: toJson(normalized),
        modelVersion,
        inputTokens,
        outputTokens,
        estimatedCostUsd: new Prisma.Decimal(estimatedCostUsd.toFixed(8)),
        processingDurationMs,
        extractionConfidence,
        extractedAt: new Date(),
        errorMessage: null,
      },
    });

    this.logger.debug(
      `Saved extraction for pdf ${pdfId} page ${pageNumber} ` +
        `(confidence=${extractionConfidence.toFixed(2)}, cost=$${estimatedCostUsd.toFixed(6)})`,
    );
  }

  async upsertInvalidResponse(params: PersistInvalidResponseParams): Promise<void> {
    const {
      pdfId, pdfPageId, pageNumber, organizationId, r2Key, promptVersion,
      rawResponse, errorMessage, modelVersion,
      inputTokens, outputTokens, estimatedCostUsd, processingDurationMs,
    } = params;

    // For invalid responses, wrap raw text in an object so it fits the Json column
    const rawJson = rawResponse != null
      ? toJson({ raw: rawResponse })
      : Prisma.JsonNull;

    await this.prisma.rawPageExtraction.upsert({
      where: { pdfId_pageNumber: { pdfId, pageNumber } },
      create: {
        pdfId,
        pdfPageId,
        pageNumber,
        organizationId,
        pageImageR2Key: r2Key,
        promptVersion,
        modelVersion,
        extractionStatus: ExtractionStatus.InvalidResponse,
        rawGeminiResponse: rawJson,
        inputTokens,
        outputTokens,
        estimatedCostUsd: new Prisma.Decimal(estimatedCostUsd.toFixed(8)),
        processingDurationMs,
        errorMessage,
        processingAttempts: 1,
      },
      update: {
        extractionStatus: ExtractionStatus.InvalidResponse,
        rawGeminiResponse: rawJson,
        modelVersion,
        inputTokens,
        outputTokens,
        estimatedCostUsd: new Prisma.Decimal(estimatedCostUsd.toFixed(8)),
        processingDurationMs,
        errorMessage,
      },
    });

    this.logger.warn(`Invalid response for pdf ${pdfId} page ${pageNumber}: ${errorMessage}`);
  }

  async upsertFailed(params: PersistFailedParams): Promise<void> {
    const { pdfId, pdfPageId, pageNumber, organizationId, r2Key, promptVersion, errorMessage } = params;

    await this.prisma.rawPageExtraction.upsert({
      where: { pdfId_pageNumber: { pdfId, pageNumber } },
      create: {
        pdfId,
        pdfPageId,
        pageNumber,
        organizationId,
        pageImageR2Key: r2Key,
        promptVersion,
        extractionStatus: ExtractionStatus.Failed,
        errorMessage,
        processingAttempts: 1,
      },
      update: {
        extractionStatus: ExtractionStatus.Failed,
        errorMessage,
      },
    });
  }
}
