import { useState } from 'react';

interface OptionImageProps {
  url: string | null | undefined;
  alt?: string;
  className?: string;
}

export function OptionImage({ url, alt = 'Option image', className = '' }: OptionImageProps) {
  const [failed, setFailed] = useState(false);

  if (!url) return null;

  if (failed) {
    return (
      <span className="block text-xs text-slate-400 italic mt-1">Image unavailable</span>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={[
        'block mt-1.5 max-h-36 max-w-full rounded-lg object-contain',
        className,
      ].join(' ').trim()}
    />
  );
}
