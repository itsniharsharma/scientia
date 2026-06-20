const MAX_WIDTH = 1600;
const WEBP_QUALITY = 0.65;

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const scale = bitmap.width > MAX_WIDTH ? MAX_WIDTH / bitmap.width : 1;
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Could not acquire 2D canvas context');
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Image compression produced no output'));
      },
      'image/webp',
      WEBP_QUALITY,
    );
  });
}
