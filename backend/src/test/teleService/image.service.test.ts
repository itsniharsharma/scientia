import { describe, it, expect, beforeEach } from 'vitest';
import sharp from 'sharp';
import { Readable } from 'stream';
import { ImageService } from '../../teleService/services/image.service';

async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 100, b: 50 } },
  })
    .png()
    .toBuffer();
}

async function pipeThrough(transform: import('sharp').Sharp, input: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    transform.on('data', (chunk: Buffer) => chunks.push(chunk));
    transform.on('end', () => resolve(Buffer.concat(chunks)));
    transform.on('error', reject);
    // Feed the PNG bytes in and signal end-of-input
    Readable.from(input).pipe(transform);
  });
}

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(() => {
    service = new ImageService();
  });

  // ── createTransform() shape ─────────────────────────────────────────────────

  it('returns a stream with Transform-like interface', () => {
    const t = service.createTransform();
    expect(typeof t.pipe).toBe('function');
    expect(typeof t.write).toBe('function');
    expect(typeof t.end).toBe('function');
  });

  it('each call returns a fresh instance', () => {
    const a = service.createTransform();
    const b = service.createTransform();
    expect(a).not.toBe(b);
  });

  // ── WebP conversion ─────────────────────────────────────────────────────────

  it('converts PNG input to WebP output', async () => {
    const input = await makePng(100, 100);
    const output = await pipeThrough(service.createTransform(), input);
    const { format } = await sharp(output).metadata();
    expect(format).toBe('webp');
  });

  it('output is a non-empty buffer', async () => {
    const input = await makePng(100, 100);
    const output = await pipeThrough(service.createTransform(), input);
    expect(output.byteLength).toBeGreaterThan(0);
  });

  // ── Resize behaviour ────────────────────────────────────────────────────────

  it('does not enlarge an image smaller than 1200px wide', async () => {
    const input = await makePng(400, 300);
    const output = await pipeThrough(service.createTransform(), input);
    const { width } = await sharp(output).metadata();
    expect(width).toBe(400);
  });

  it('does not enlarge an image exactly 1200px wide', async () => {
    const input = await makePng(1200, 800);
    const output = await pipeThrough(service.createTransform(), input);
    const { width } = await sharp(output).metadata();
    expect(width).toBe(1200);
  });

  it('resizes an image wider than 1200px down to 1200px', async () => {
    const input = await makePng(1600, 900);
    const output = await pipeThrough(service.createTransform(), input);
    const { width, height } = await sharp(output).metadata();
    expect(width).toBe(1200);
    // Aspect ratio preserved: 1600×900 → 1200×675
    expect(height).toBe(675);
  });

  // ── Error propagation ───────────────────────────────────────────────────────

  it('emits an error event when fed non-image bytes', async () => {
    const garbage = Buffer.from('this is not an image');
    const transform = service.createTransform();

    await expect(pipeThrough(transform, garbage)).rejects.toThrow();
  });
});
