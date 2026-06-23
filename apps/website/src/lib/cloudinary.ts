const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY as string | undefined;
type CloudinaryResponse = { secure_url: string };
type CloudinaryError = { error?: { message: string } };

export async function uploadToCloudinary(blob: Blob, originalFilename: string): Promise<string> {
  if (!CLOUD_NAME || !API_KEY) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_API_KEY in .env',
    );
  }

  const timestamp = Math.round(Date.now() / 1000).toString();

  const signRes = await fetch('/api/cloudinary/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ timestamp }),
  });

  if (!signRes.ok) {
    throw new Error('Failed to get upload signature from server');
  }

  const { signature } = (await signRes.json()) as { signature: string };

  const form = new FormData();
  form.append('file', blob, originalFilename.replace(/\.[^.]+$/, '.webp'));
  form.append('api_key', API_KEY);
  form.append('timestamp', timestamp);
  form.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as CloudinaryError;
    throw new Error(
      body.error?.message ?? `Cloudinary upload failed (HTTP ${response.status})`,
    );
  }

  const data = (await response.json()) as CloudinaryResponse;
  return data.secure_url;
}
