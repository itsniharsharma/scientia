import sharp from 'sharp';
import type { Sharp } from 'sharp';

const RESIZE_WIDTH = 1200;
const WEBP_QUALITY  = 75;

export class ImageService {
  /**
   * Returns a configured Sharp Transform stream.
   * Caller wires: inputStream → createTransform() → cloudinaryWriteStream
   * using stream.pipeline() for proper backpressure and error propagation.
   */
  createTransform(): Sharp {
    return sharp()
      .resize({ width: RESIZE_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY });
  }
}
