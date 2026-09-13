import { logger } from '../../shared/logger';

interface TelegramGetFileResponse {
  ok: boolean;
  result?: { file_path: string };
  description?: string;
}

/**
 * Downloads any Telegram file by file_id as a Buffer. Generic transport
 * only — no knowledge of what the file contains or what happens to it
 * afterwards. Kept separate from TelegramImageAdapter (telegram.adapter.ts),
 * which is specific to the question-image upload flow and returns a stream
 * rather than a buffer.
 */
export async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');

  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const fileData = (await fileRes.json()) as TelegramGetFileResponse;
  if (!fileData.ok || !fileData.result?.file_path) {
    throw new Error(`Telegram getFile failed: ${fileData.description ?? 'no file_path returned'}`);
  }

  logger.info('TELEGRAM_DOCUMENT_DOWNLOAD_START', { fileId });
  const downloadUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
  const downloadRes = await fetch(downloadUrl);
  if (!downloadRes.ok) {
    throw new Error(`Telegram file download failed: HTTP ${downloadRes.status}`);
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
