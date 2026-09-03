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
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-xs text-slate-400 select-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
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
        // bg-white is intentional here (not theme surface color) — diagrams
        // are authored assuming a white backdrop, so it stays fixed in both themes.
        'w-full max-h-72 rounded-xl border border-slate-100 object-contain bg-white dark:border-slate-700',
        className,
      ].join(' ').trim()}
    />
  );
}
