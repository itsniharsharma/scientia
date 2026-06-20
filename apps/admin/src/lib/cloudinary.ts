const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY as string | undefined;
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET as string | undefined;

type CloudinaryResponse = { secure_url: string };
type CloudinaryError = { error?: { message: string } };

async function sha256hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function uploadToCloudinary(blob: Blob, originalFilename: string): Promise<string> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_API_KEY, and VITE_CLOUDINARY_API_SECRET in apps/admin/.env',
    );
  }

  const timestamp = Math.round(Date.now() / 1000).toString();

  // Cloudinary signed-upload signature: sort params alphabetically, join as
  // "key=value&key=value", append the API secret, then SHA-256 hash.
  const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha256hex(stringToSign);

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
