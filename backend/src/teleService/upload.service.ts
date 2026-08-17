import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { prisma } from '../lib/prisma';
import { logger } from '../shared/logger';
import { ValidationService } from './services/validation.service';
import { ImageService } from './services/image.service';
import { CloudinaryService } from './services/cloudinary.service';
import { QuestionService } from './services/question.service';
import {
  UploadValidationError,
  UploadImageError,
  UploadCloudinaryError,
  UploadDatabaseError,
} from './errors';
import type { UploadRequest, UploadResult, StepTimings, UploadJobStatus } from './types';
import { uploadMetrics } from './metrics';

export class UploadService {
  constructor(
    private readonly validation:  ValidationService,
    private readonly image:       ImageService,
    private readonly cloudinary:  CloudinaryService,
    private readonly questions:   QuestionService,
  ) {}

  async upload(request: UploadRequest): Promise<UploadResult> {
    const { context, imageStream, questionType, correctAnswer } = request;
    const { uploadId, teacherId, topicId, uploadSource } = context;
    const timings: StepTimings = {};
    const startMs = Date.now();

    // ── Create UploadJob immediately so every outcome is traceable ────────────
    await prisma.uploadJob.create({
      data: { id: uploadId, teacherId, topicId, uploadSource, status: 'RECEIVED' },
    });

    logger.info('UPLOAD_RECEIVED', { uploadId, teacherId, topicId, uploadSource });

    let cloudinaryPublicId: string | undefined;

    try {
      // ── VALIDATING ─────────────────────────────────────────────────────────
      await this.setStatus(uploadId, 'VALIDATING');
      const t0 = Date.now();

      await this.validation.validate({ teacherId, topicId, questionType, correctAnswer });
      timings.validationMs = Date.now() - t0;
      logger.info('VALIDATION_DONE', { uploadId, ms: timings.validationMs });

      // ── DOWNLOADING → COMPRESSING → UPLOADING (one streaming pipeline) ─────
      await this.setStatus(uploadId, 'DOWNLOADING');
      const t1 = Date.now();

      const sharpTransform = this.image.createTransform();
      const folder = `scientia/questions/${topicId}`;
      const { writeStream, result: cloudinaryResult } = this.cloudinary.createUploadStream(folder);

      await this.setStatus(uploadId, 'COMPRESSING');

      // stream.pipeline() — backpressure-aware, propagates errors across all three streams
      try {
        await pipeline(
          Readable.from(imageStream as AsyncIterable<unknown>),
          sharpTransform,
          writeStream,
        );
      } catch (err) {
        throw new UploadImageError(
          `Streaming pipeline failed: ${err instanceof Error ? err.message : String(err)}`,
          err instanceof Error ? err : undefined,
        );
      }

      await this.setStatus(uploadId, 'UPLOADING');
      const cloudinaryData = await cloudinaryResult;
      cloudinaryPublicId = cloudinaryData.publicId;
      timings.streamingMs = Date.now() - t1;

      await prisma.uploadJob.update({
        where: { id: uploadId },
        data:  { cloudinaryPublicId },
      });

      logger.info('CLOUDINARY_UPLOAD_DONE', {
        uploadId,
        publicId: cloudinaryPublicId,
        bytes:    cloudinaryData.bytes,
        ms:       timings.streamingMs,
      });

      // ── CREATING_QUESTION ──────────────────────────────────────────────────
      await this.setStatus(uploadId, 'CREATING_QUESTION');
      const t2 = Date.now();

      const question = await this.questions.create({
        topicId,
        secureUrl: cloudinaryData.secureUrl,
        questionType,
        correctAnswer,
      });

      timings.dbMs    = Date.now() - t2;
      timings.totalMs = Date.now() - startMs;

      logger.info('QUESTION_CREATED', {
        uploadId, questionId: question.id, ms: timings.dbMs,
      });

      // ── COMPLETED ──────────────────────────────────────────────────────────
      await prisma.uploadJob.update({
        where: { id: uploadId },
        data:  { status: 'COMPLETED', questionId: question.id, resolvedAt: new Date() },
      });

      logger.info('UPLOAD_SUCCESS', { uploadId, questionId: question.id, timings });

      uploadMetrics.recordSuccess({
        totalMs:    timings.totalMs,
        streamingMs: timings.streamingMs,
        dbMs:       timings.dbMs,
        imageBytes: cloudinaryData.bytes,
      });

      return {
        questionId:         question.id,
        cloudinaryPublicId,
        uploadJobId:        uploadId,
        timings,
      };

    } catch (err) {
      return this.handleFailure({ uploadId, err, cloudinaryPublicId, startMs });
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async setStatus(id: string, status: UploadJobStatus): Promise<void> {
    await prisma.uploadJob.update({ where: { id }, data: { status } });
  }

  private async handleFailure(params: {
    uploadId:           string;
    err:                unknown;
    cloudinaryPublicId: string | undefined;
    startMs:            number;
  }): Promise<never> {
    const { uploadId, err, cloudinaryPublicId, startMs } = params;
    const error      = err instanceof Error ? err : new Error(String(err));
    const failedStep = this.classifyStep(error);
    const totalMs    = Date.now() - startMs;

    logger.error('UPLOAD_FAILED', {
      uploadId, failedStep, error: error.message, ms: totalMs,
    });
    uploadMetrics.recordFailure();

    // Rollback: only needed if Cloudinary succeeded but DB write failed
    if (cloudinaryPublicId && err instanceof UploadDatabaseError) {
      await this.attemptRollback(uploadId, cloudinaryPublicId, error);
    } else {
      await prisma.uploadJob.update({
        where: { id: uploadId },
        data:  { status: 'FAILED', failedStep, errorMessage: error.message },
      });
    }

    throw error;
  }

  private async attemptRollback(
    uploadId:  string,
    publicId:  string,
    sourceErr: Error,
  ): Promise<void> {
    logger.info('ROLLBACK_STARTING', { uploadId, publicId });
    try {
      await this.cloudinary.delete(publicId);
      await prisma.uploadJob.update({
        where: { id: uploadId },
        data:  {
          status:       'FAILED',
          failedStep:   'CREATING_QUESTION',
          errorMessage: sourceErr.message,
        },
      });
      uploadMetrics.recordRollback();
      logger.info('ROLLBACK_SUCCESS', { uploadId, publicId });
    } catch (deleteErr) {
      // Double failure — asset is orphaned; scheduled cleanup will retry
      await prisma.uploadJob.update({
        where: { id: uploadId },
        data:  {
          status:             'ORPHANED',
          cloudinaryPublicId: publicId,
          failedStep:         'ROLLBACK',
          errorMessage:       `DB: ${sourceErr.message} | Delete: ${deleteErr instanceof Error ? deleteErr.message : String(deleteErr)}`,
        },
      });
      uploadMetrics.recordOrphan();
      logger.error('ROLLBACK_FAILED_ORPHANED', {
        uploadId,
        publicId,
        dbError:     sourceErr.message,
        deleteError: deleteErr instanceof Error ? deleteErr.message : String(deleteErr),
      });
    }
  }

  private classifyStep(err: Error): string {
    if (err instanceof UploadValidationError)  return 'VALIDATING';
    if (err instanceof UploadImageError)       return 'COMPRESSING';
    if (err instanceof UploadCloudinaryError)  return 'UPLOADING';
    if (err instanceof UploadDatabaseError)    return 'CREATING_QUESTION';
    return 'UNKNOWN';
  }
}

// ── Singleton — injected dependencies, no global state ───────────────────────

export const uploadService = new UploadService(
  new ValidationService(),
  new ImageService(),
  new CloudinaryService(),
  new QuestionService(),
);
