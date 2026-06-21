import { useRef, useState } from 'react';
import { compressImage } from '../lib/compress-image';
import { uploadToCloudinary } from '../lib/cloudinary';

interface ImageUploadProps {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  onUploadStateChange?: (uploading: boolean) => void;
  error?: string;
}

function ImageUpload({
  label,
  value,
  onChange,
  onUploadStateChange,
  error,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    setUploadError(null);
    onUploadStateChange?.(true);

    try {
      const blob = await compressImage(file);
      const url = await uploadToCloudinary(blob, file.name);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      onUploadStateChange?.(false);
    }
  }

  function handleRemove() {
    onChange(null);
    setUploadError(null);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>

      {value && !uploading && (
        <div className="relative w-fit">
          <img
            src={value}
            alt={label}
            className="h-24 w-auto rounded-md border border-slate-200 bg-slate-50 object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            aria-label={`Remove ${label}`}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        </div>
      )}

      {uploading ? (
        <div className="flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          <svg
            className="h-4 w-4 animate-spin text-brand-700"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Uploading"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading…
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={[
              'flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-1',
              value
                ? 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                : 'border-dashed border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700',
            ].join(' ')}
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            {value ? 'Replace image' : 'Upload image'}
          </button>
        </>
      )}

      {error && !uploadError && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {uploadError && (
        <p className="text-xs text-red-600" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}

export { ImageUpload };
