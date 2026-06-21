import { useState, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexContentProps {
  content: string | null | undefined;
  className?: string;
}

export function LatexContent({ content, className = '' }: LatexContentProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!content?.trim()) {
      setHtml(null);
      setError(false);
      return;
    }
    try {
      const rendered = katex.renderToString(content, {
        displayMode: true,
        throwOnError: false,
        strict: false,
        output: 'html',
      });
      setHtml(rendered);
      setError(false);
    } catch {
      setError(true);
      setHtml(null);
    }
  }, [content]);

  if (!content?.trim()) return null;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-600">
        LaTeX error — check syntax
      </div>
    );
  }

  if (!html) return null;

  return (
    <div
      className={['overflow-x-auto py-1', className].join(' ').trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
