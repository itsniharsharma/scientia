import { useState } from 'react';

interface QuestionImageProps {
  url: string | null | undefined;
  alt?: string;
  className?: string;
}

export function QuestionImage({ url, alt = 'Question image', className = '' }: QuestionImageProps) {
  const [failed, setFailed] = useState(false);

  if (!url) return null;

  if (failed) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-xs text-slate-400 select-none">
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={[
        'w-full max-h-72 rounded-xl border border-slate-100 object-contain bg-white',
        className,
      ].join(' ').trim()}
    />
  );
}
