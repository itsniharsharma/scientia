import { v2 as cloudinary } from 'cloudinary';
import type { Writable } from 'stream';
import { UploadCloudinaryError } from '../errors';
import type { CloudinaryUploadResult } from '../types';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export class CloudinaryService {
  /**
   * Creates a Cloudinary upload_stream writable and a Promise that resolves
   * when the upload completes. Caller uses stream.pipeline() to pipe into writeStream,
   * then awaits result for the final upload metadata.
   */
  createUploadStream(folder: string): {
    writeStream: Writable;
    result:      Promise<CloudinaryUploadResult>;
  } {
    let resolve!: (r: CloudinaryUploadResult) => void;
    let reject!:  (e: Error) => void;

    const result = new Promise<CloudinaryUploadResult>((res, rej) => {
      resolve = res;
      reject  = rej;
    });

    const writeStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, uploadResult) => {
        if (error) {
          reject(new UploadCloudinaryError(`Cloudinary upload failed: ${error.message}`, error as unknown as Error));
          return;
        }
        if (!uploadResult) {
          reject(new UploadCloudinaryError('Cloudinary returned no result'));
          return;
        }
        resolve({
          publicId:  uploadResult.public_id,
          secureUrl: uploadResult.secure_url,
          bytes:     uploadResult.bytes,
          width:     uploadResult.width,
          height:    uploadResult.height,
          format:    uploadResult.format,
        });
      },
    );

    return { writeStream, result };
  }

  async delete(publicId: string): Promise<void> {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (res.result !== 'ok' && res.result !== 'not found') {
      throw new UploadCloudinaryError(
        `Cloudinary delete returned unexpected status "${res.result}" for ${publicId}`,
      );
    }
  }

  /**
   * Generates a signed URL with a 1-hour expiry.
   * DB stores publicId only — URLs are generated on demand, never persisted.
   */
  generateSignedUrl(publicId: string, expiresInSeconds = 3600): string {
    return cloudinary.url(publicId, {
      sign_url:   true,
      type:       'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    });
  }
}
