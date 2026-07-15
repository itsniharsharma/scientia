import { Readable } from 'stream';
import { UploadImageError } from '../errors';
import { logger } from '../../shared/logger';

interface TelegramGetFileResponse {
  ok: boolean;
  result?: { file_path: string };
  description?: string;
}

/**
 * Downloads a Telegram photo by file_id and returns a Node.js ReadableStream.
 * No compression, validation, or Cloudinary calls — this is purely a download adapter.
 */
export class TelegramImageAdapter {
  /**
   * Downloads the image from Telegram. Retries once on transient network failure.
   * Returns a Node.js ReadableStream — no processing.
   */
  async download(fileId: string): Promise<NodeJS.ReadableStream> {
    try {
      return await this.doDownload(fileId);
    } catch (err) {
      logger.warn('TELEGRAM_DOWNLOAD_RETRYING', {
        fileId,
        error: err instanceof Error ? err.message : String(err),
      });
      await new Promise(r => setTimeout(r, 1000));
      return this.doDownload(fileId); // propagates on second failure
    }
  }

  private async doDownload(fileId: string): Promise<NodeJS.ReadableStream> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new UploadImageError('TELEGRAM_BOT_TOKEN is not configured');

    // Step 1: Resolve file_id → file_path via Bot API
    let fileRes: Response;
    try {
      fileRes = await fetch(
        `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
      );
    } catch (err) {
      throw new UploadImageError(
        `Telegram getFile network error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const fileData = await fileRes.json() as TelegramGetFileResponse;
    if (!fileData.ok || !fileData.result?.file_path) {
      throw new UploadImageError(
        `Telegram getFile failed: ${fileData.description ?? 'no file_path returned'}`,
      );
    }

    const filePath = fileData.result.file_path;
    logger.info('TELEGRAM_DOWNLOAD_START', { fileId, filePath });

    // Step 2: Stream the file from Telegram CDN
    const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    let downloadRes: Response;
    try {
      downloadRes = await fetch(downloadUrl);
    } catch (err) {
      throw new UploadImageError(
        `Telegram file download network error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!downloadRes.ok) {
      throw new UploadImageError(`Telegram file download failed: HTTP ${downloadRes.status}`);
    }

    if (!downloadRes.body) {
      throw new UploadImageError('Telegram returned an empty response body');
    }

    // Convert Web ReadableStream to Node.js Readable (requires Node 17+)
    return Readable.fromWeb(
      downloadRes.body as import('stream/web').ReadableStream<Uint8Array>,
    );
  }
}

// Singleton — token is read lazily per call (env may not be set at module load in tests)
export const telegramAdapter = new TelegramImageAdapter();
