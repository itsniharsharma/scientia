import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PassThrough } from 'stream';
import { UploadCloudinaryError } from '../../teleService/errors';

vi.mock('cloudinary', () => ({
  v2: {
    config:    vi.fn(),
    uploader:  {
      upload_stream: vi.fn(),
      destroy:       vi.fn(),
    },
    url: vi.fn(),
  },
}));

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from '../../teleService/services/cloudinary.service';

const mockUploadStream = vi.mocked(cloudinary.uploader.upload_stream);
const mockDestroy      = vi.mocked(cloudinary.uploader.destroy);
const mockUrl          = vi.mocked(cloudinary.url);

const FAKE_CLOUDINARY_RESULT = {
  public_id:  'scientia/questions/topic-1/abc123',
  secure_url: 'https://res.cloudinary.com/denbytwkt/image/upload/abc123.webp',
  bytes:      5000,
  width:      800,
  height:     600,
  format:     'webp',
};

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CloudinaryService();
  });

  // ── createUploadStream ──────────────────────────────────────────────────────

  describe('createUploadStream()', () => {
    it('returns an object with writeStream and result', () => {
      const pt = new PassThrough();
      mockUploadStream.mockReturnValue(pt as never);

      const { writeStream, result } = service.createUploadStream('scientia/questions');

      expect(writeStream).toBe(pt);
      expect(result).toBeInstanceOf(Promise);
    });

    it('calls upload_stream with the supplied folder and image resource_type', () => {
      mockUploadStream.mockReturnValue(new PassThrough() as never);

      service.createUploadStream('scientia/questions/topic-1');

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'scientia/questions/topic-1', resource_type: 'image' }),
        expect.any(Function),
      );
    });

    it('result resolves with mapped CloudinaryUploadResult on success', async () => {
      mockUploadStream.mockImplementation(((_opts: unknown, callback: (e: unknown, r: unknown) => void) => {
        const pt = new PassThrough();
        process.nextTick(() => callback(undefined, FAKE_CLOUDINARY_RESULT));
        return pt as never;
      }) as never);

      const { result } = service.createUploadStream('scientia/questions');
      const data = await result;

      expect(data.publicId).toBe(FAKE_CLOUDINARY_RESULT.public_id);
      expect(data.secureUrl).toBe(FAKE_CLOUDINARY_RESULT.secure_url);
      expect(data.bytes).toBe(FAKE_CLOUDINARY_RESULT.bytes);
      expect(data.width).toBe(FAKE_CLOUDINARY_RESULT.width);
      expect(data.height).toBe(FAKE_CLOUDINARY_RESULT.height);
      expect(data.format).toBe(FAKE_CLOUDINARY_RESULT.format);
    });

    it('result rejects with UploadCloudinaryError when callback receives an error', async () => {
      mockUploadStream.mockImplementation(((_opts: unknown, callback: (e: unknown, r: unknown) => void) => {
        const pt = new PassThrough();
        process.nextTick(() => callback({ message: 'API quota exceeded' }, undefined));
        return pt as never;
      }) as never);

      const { result } = service.createUploadStream('scientia/questions');

      await expect(result).rejects.toThrow(UploadCloudinaryError);
      await expect(result).rejects.toThrow('API quota exceeded');
    });

    it('result rejects with UploadCloudinaryError when callback receives no result', async () => {
      mockUploadStream.mockImplementation(((_opts: unknown, callback: (e: unknown, r: unknown) => void) => {
        const pt = new PassThrough();
        process.nextTick(() => callback(undefined, undefined));
        return pt as never;
      }) as never);

      const { result } = service.createUploadStream('scientia/questions');

      await expect(result).rejects.toThrow(UploadCloudinaryError);
      await expect(result).rejects.toThrow('no result');
    });
  });

  // ── delete ──────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('resolves when Cloudinary returns "ok"', async () => {
      mockDestroy.mockResolvedValue({ result: 'ok' } as never);
      await expect(service.delete('scientia/questions/abc')).resolves.toBeUndefined();
      expect(mockDestroy).toHaveBeenCalledWith('scientia/questions/abc', { resource_type: 'image' });
    });

    it('resolves (idempotent) when Cloudinary returns "not found"', async () => {
      mockDestroy.mockResolvedValue({ result: 'not found' } as never);
      await expect(service.delete('scientia/questions/ghost')).resolves.toBeUndefined();
    });

    it('throws UploadCloudinaryError for any other result status', async () => {
      mockDestroy.mockResolvedValue({ result: 'error' } as never);
      await expect(service.delete('scientia/questions/bad')).rejects.toThrow(UploadCloudinaryError);
      await expect(service.delete('scientia/questions/bad')).rejects.toThrow(
        'unexpected status "error"',
      );
    });

    it('propagates destroy rejection as-is', async () => {
      mockDestroy.mockRejectedValue(new Error('Network failure'));
      await expect(service.delete('scientia/questions/abc')).rejects.toThrow('Network failure');
    });
  });

  // ── generateSignedUrl ───────────────────────────────────────────────────────

  describe('generateSignedUrl()', () => {
    it('calls cloudinary.url with sign_url: true and authenticated type', () => {
      mockUrl.mockReturnValue('https://res.cloudinary.com/signed?...');
      service.generateSignedUrl('scientia/questions/abc');

      expect(mockUrl).toHaveBeenCalledWith(
        'scientia/questions/abc',
        expect.objectContaining({ sign_url: true, type: 'authenticated' }),
      );
    });

    it('defaults expiry to 3600 seconds from now', () => {
      mockUrl.mockReturnValue('https://signed-url');
      const before = Math.floor(Date.now() / 1000);

      service.generateSignedUrl('pub/id');

      const after = Math.floor(Date.now() / 1000);
      const callArg = vi.mocked(cloudinary.url).mock.calls[0][1] as Record<string, unknown>;
      const expiresAt = callArg['expires_at'] as number;

      expect(expiresAt).toBeGreaterThanOrEqual(before + 3600);
      expect(expiresAt).toBeLessThanOrEqual(after + 3600);
    });

    it('accepts a custom expiry duration', () => {
      mockUrl.mockReturnValue('https://short-url');
      const before = Math.floor(Date.now() / 1000);

      service.generateSignedUrl('pub/id', 300);

      const callArg = vi.mocked(cloudinary.url).mock.calls[0][1] as Record<string, unknown>;
      const expiresAt = callArg['expires_at'] as number;

      expect(expiresAt).toBeGreaterThanOrEqual(before + 300);
    });

    it('returns the URL produced by cloudinary.url', () => {
      mockUrl.mockReturnValue('https://expected-url');
      expect(service.generateSignedUrl('pub/id')).toBe('https://expected-url');
    });
  });
});
