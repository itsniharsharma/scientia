import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { PassThrough, Readable } from 'stream';
import { UploadService } from '../../teleService/upload.service';
import { UploadValidationError, UploadImageError, UploadCloudinaryError, UploadDatabaseError } from '../../teleService/errors';
import type { ValidationService }  from '../../teleService/services/validation.service';
import type { ImageService }       from '../../teleService/services/image.service';
import type { CloudinaryService }  from '../../teleService/services/cloudinary.service';
import type { QuestionService }    from '../../teleService/services/question.service';
import type { CloudinaryUploadResult } from '../../teleService/types';
import type { Question }           from '@scientia/types';

// ── Module mocks ────────────────────────────────────────────────────────────

vi.mock('../../lib/prisma', () => ({
  prisma: {
    uploadJob: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('stream/promises', () => ({
  pipeline: vi.fn(),
}));

// Silence logger noise in tests
vi.mock('../../shared/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { prisma }    from '../../lib/prisma';
import { pipeline }  from 'stream/promises';

const mockCreate  = vi.mocked(prisma.uploadJob.create);
const mockUpdate  = vi.mocked(prisma.uploadJob.update);
const mockPipeline = vi.mocked(pipeline);

// ── Constants ───────────────────────────────────────────────────────────────

const TEST_UPLOAD_ID  = 'upload-uuid-123';
const TEST_TEACHER_ID = 'teacher-uuid-456';
const TEST_TOPIC_ID   = 'topic-uuid-789';
const TEST_PUBLIC_ID  = `scientia/questions/${TEST_TOPIC_ID}/img`;
const TEST_QUESTION_ID = 'question-uuid-abc';

const CLOUDINARY_SUCCESS: CloudinaryUploadResult = {
  publicId:  TEST_PUBLIC_ID,
  secureUrl: 'https://res.cloudinary.com/test.webp',
  bytes:     5000,
  width:     800,
  height:    600,
  format:    'webp',
};

const FAKE_QUESTION: Partial<Question> = {
  id: TEST_QUESTION_ID,
};

function makeRequest(): Parameters<UploadService['upload']>[0] {
  return {
    context: {
      uploadId:     TEST_UPLOAD_ID,
      teacherId:    TEST_TEACHER_ID,
      topicId:      TEST_TOPIC_ID,
      uploadSource: 'TELEGRAM',
      timestamp:    new Date(),
    },
    imageStream:   Readable.from(['fake png bytes']),
    questionType:  'SINGLE',
    correctAnswer: 'B',
  };
}

// ── Mock services factory ───────────────────────────────────────────────────

function makeServices() {
  const validation: Pick<ValidationService, 'validate'> = {
    validate: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };

  const image: Pick<ImageService, 'createTransform'> = {
    createTransform: vi.fn().mockReturnValue(new PassThrough()),
  };

  const cloudinary: Pick<CloudinaryService, 'createUploadStream' | 'delete' | 'generateSignedUrl'> = {
    createUploadStream: vi.fn().mockReturnValue({
      writeStream: new PassThrough(),
      result:      Promise.resolve(CLOUDINARY_SUCCESS),
    }),
    delete:           vi.fn().mockResolvedValue(undefined),
    generateSignedUrl: vi.fn().mockReturnValue('https://signed-url'),
  };

  const questions: Pick<QuestionService, 'create'> = {
    create: vi.fn().mockResolvedValue(FAKE_QUESTION),
  };

  return { validation, image, cloudinary, questions };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('UploadService', () => {
  let services: ReturnType<typeof makeServices>;
  let service: UploadService;

  beforeEach(() => {
    vi.clearAllMocks();

    services = makeServices();
    service  = new UploadService(
      services.validation  as unknown as ValidationService,
      services.image       as unknown as ImageService,
      services.cloudinary  as unknown as CloudinaryService,
      services.questions   as unknown as QuestionService,
    );

    // Default: all Prisma calls succeed
    mockCreate.mockResolvedValue({ id: TEST_UPLOAD_ID } as never);
    mockUpdate.mockResolvedValue({ id: TEST_UPLOAD_ID } as never);

    // Default: pipeline resolves immediately
    mockPipeline.mockResolvedValue(undefined);
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  describe('happy path', () => {
    it('returns UploadResult with questionId, cloudinaryPublicId, uploadJobId', async () => {
      const result = await service.upload(makeRequest());

      expect(result.questionId).toBe(TEST_QUESTION_ID);
      expect(result.cloudinaryPublicId).toBe(TEST_PUBLIC_ID);
      expect(result.uploadJobId).toBe(TEST_UPLOAD_ID);
    });

    it('returns timings with all durations as non-negative numbers', async () => {
      const { timings } = await service.upload(makeRequest());
      expect(timings.validationMs).toBeGreaterThanOrEqual(0);
      expect(timings.streamingMs).toBeGreaterThanOrEqual(0);
      expect(timings.dbMs).toBeGreaterThanOrEqual(0);
      expect(timings.totalMs).toBeGreaterThanOrEqual(0);
    });

    it('creates UploadJob with RECEIVED status before any processing', async () => {
      await service.upload(makeRequest());
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id:           TEST_UPLOAD_ID,
          teacherId:    TEST_TEACHER_ID,
          topicId:      TEST_TOPIC_ID,
          uploadSource: 'TELEGRAM',
          status:       'RECEIVED',
        }),
      });
    });

    it('completes the UploadJob with COMPLETED status and questionId', async () => {
      await service.upload(makeRequest());

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TEST_UPLOAD_ID },
          data:  expect.objectContaining({
            status:     'COMPLETED',
            questionId: TEST_QUESTION_ID,
          }),
        }),
      );
    });

    it('stores cloudinaryPublicId on the job after upload', async () => {
      await service.upload(makeRequest());

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TEST_UPLOAD_ID },
          data:  expect.objectContaining({ cloudinaryPublicId: TEST_PUBLIC_ID }),
        }),
      );
    });
  });

  // ── Status transitions ──────────────────────────────────────────────────────

  describe('status transitions (happy path)', () => {
    it('transitions through all statuses in the correct order', async () => {
      await service.upload(makeRequest());

      const updateStatuses = mockUpdate.mock.calls
        .map(([arg]) => (arg as { data?: { status?: string } }).data?.status)
        .filter(Boolean);

      // Ordered status sequence leading to COMPLETED
      const idx = (s: string) => updateStatuses.indexOf(s);

      expect(idx('VALIDATING')).toBeLessThan(idx('DOWNLOADING'));
      expect(idx('DOWNLOADING')).toBeLessThan(idx('COMPRESSING'));
      expect(idx('COMPRESSING')).toBeLessThan(idx('UPLOADING'));
      expect(idx('UPLOADING')).toBeLessThan(idx('CREATING_QUESTION'));
      expect(idx('CREATING_QUESTION')).toBeLessThan(idx('COMPLETED'));
    });
  });

  // ── Validation failure ──────────────────────────────────────────────────────

  describe('when validation fails', () => {
    beforeEach(() => {
      (services.validation.validate as MockedFunction<typeof services.validation.validate>)
        .mockRejectedValue(new UploadValidationError('Teacher not found'));
    });

    it('re-throws the UploadValidationError', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow(UploadValidationError);
    });

    it('marks the job FAILED with failedStep VALIDATING', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status:     'FAILED',
            failedStep: 'VALIDATING',
          }),
        }),
      );
    });

    it('never calls createUploadStream (no unnecessary Cloudinary calls)', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();
      expect(services.cloudinary.createUploadStream).not.toHaveBeenCalled();
    });

    it('never calls questions.create', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();
      expect(services.questions.create).not.toHaveBeenCalled();
    });
  });

  // ── Streaming / compression failure ────────────────────────────────────────

  describe('when the image pipeline fails', () => {
    beforeEach(() => {
      mockPipeline.mockRejectedValue(new Error('Sharp decoding failed'));
    });

    it('re-throws wrapped in UploadImageError', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow(UploadImageError);
    });

    it('marks the job FAILED with failedStep COMPRESSING', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status:     'FAILED',
            failedStep: 'COMPRESSING',
          }),
        }),
      );
    });

    it('never calls questions.create (no DB write without a successful image)', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();
      expect(services.questions.create).not.toHaveBeenCalled();
    });
  });

  // ── Cloudinary failure ──────────────────────────────────────────────────────

  describe('when Cloudinary upload fails', () => {
    beforeEach(() => {
      (services.cloudinary.createUploadStream as MockedFunction<typeof services.cloudinary.createUploadStream>)
        .mockReturnValue({
          writeStream: new PassThrough(),
          result:      Promise.reject(new UploadCloudinaryError('Cloudinary quota exceeded')),
        });
    });

    it('re-throws the UploadCloudinaryError', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow(UploadCloudinaryError);
    });

    it('marks the job FAILED with failedStep UPLOADING', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status:     'FAILED',
            failedStep: 'UPLOADING',
          }),
        }),
      );
    });

    it('does NOT call cloudinary.delete (publicId never set — nothing to roll back)', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();
      expect(services.cloudinary.delete).not.toHaveBeenCalled();
    });
  });

  // ── DB failure + clean rollback ─────────────────────────────────────────────

  describe('when DB fails after Cloudinary succeeds and rollback succeeds', () => {
    beforeEach(() => {
      (services.questions.create as MockedFunction<typeof services.questions.create>)
        .mockRejectedValue(new UploadDatabaseError('Unique constraint'));
    });

    it('re-throws the UploadDatabaseError', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow(UploadDatabaseError);
    });

    it('calls cloudinary.delete with the publicId to roll back the orphaned asset', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();

      expect(services.cloudinary.delete).toHaveBeenCalledWith(TEST_PUBLIC_ID);
    });

    it('marks the job FAILED (not ORPHANED) when delete succeeds', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();

      // The final update must be FAILED, not ORPHANED
      const lastUpdate = mockUpdate.mock.calls.at(-1)![0] as { data: { status: string } };
      expect(lastUpdate.data.status).toBe('FAILED');
    });

    it('sets failedStep to CREATING_QUESTION', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();

      const failedCall = mockUpdate.mock.calls.find(
        ([arg]) => (arg as { data?: { status?: string } }).data?.status === 'FAILED',
      );
      expect(failedCall![0]).toMatchObject({
        data: expect.objectContaining({ failedStep: 'CREATING_QUESTION' }),
      });
    });
  });

  // ── DB failure + rollback also fails → ORPHANED ─────────────────────────────

  describe('when DB fails AND Cloudinary delete also fails (double failure)', () => {
    beforeEach(() => {
      (services.questions.create as MockedFunction<typeof services.questions.create>)
        .mockRejectedValue(new UploadDatabaseError('DB write failed'));

      (services.cloudinary.delete as MockedFunction<typeof services.cloudinary.delete>)
        .mockRejectedValue(new UploadCloudinaryError('Delete API unavailable'));
    });

    it('marks the job ORPHANED so the cleanup job can retry', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ORPHANED' }),
        }),
      );
    });

    it('records the cloudinaryPublicId in the ORPHANED job for cleanup', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();

      const orphanedCall = mockUpdate.mock.calls.find(
        ([arg]) => (arg as { data?: { status?: string } }).data?.status === 'ORPHANED',
      );
      expect(orphanedCall![0]).toMatchObject({
        data: expect.objectContaining({ cloudinaryPublicId: TEST_PUBLIC_ID }),
      });
    });

    it('sets failedStep to ROLLBACK in the ORPHANED record', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();

      const orphanedCall = mockUpdate.mock.calls.find(
        ([arg]) => (arg as { data?: { status?: string } }).data?.status === 'ORPHANED',
      );
      expect(orphanedCall![0]).toMatchObject({
        data: expect.objectContaining({ failedStep: 'ROLLBACK' }),
      });
    });

    it('includes both DB and delete error messages in errorMessage', async () => {
      await expect(service.upload(makeRequest())).rejects.toThrow();

      const orphanedCall = mockUpdate.mock.calls.find(
        ([arg]) => (arg as { data?: { status?: string } }).data?.status === 'ORPHANED',
      );
      const errorMessage = (orphanedCall![0] as { data: { errorMessage: string } }).data.errorMessage;

      expect(errorMessage).toContain('DB write failed');
      expect(errorMessage).toContain('Delete API unavailable');
    });
  });

  // ── DI wiring ───────────────────────────────────────────────────────────────

  describe('dependency injection', () => {
    it('passes teacherId + topicId + questionType + correctAnswer to validation.validate', async () => {
      const req = makeRequest();
      await service.upload(req);

      expect(services.validation.validate).toHaveBeenCalledWith({
        teacherId:    TEST_TEACHER_ID,
        topicId:      TEST_TOPIC_ID,
        questionType:  req.questionType,
        correctAnswer: req.correctAnswer,
      });
    });

    it('passes the topic-scoped folder to cloudinary.createUploadStream', async () => {
      await service.upload(makeRequest());

      expect(services.cloudinary.createUploadStream).toHaveBeenCalledWith(
        `scientia/questions/${TEST_TOPIC_ID}`,
      );
    });

    it('passes publicId + questionType + correctAnswer to questions.create', async () => {
      const req = makeRequest();
      await service.upload(req);

      expect(services.questions.create).toHaveBeenCalledWith({
        topicId:       TEST_TOPIC_ID,
        publicId:      TEST_PUBLIC_ID,
        questionType:  req.questionType,
        correctAnswer: req.correctAnswer,
      });
    });
  });
});
