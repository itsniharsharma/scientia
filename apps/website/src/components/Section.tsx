import type { ReactNode, HTMLAttributes } from 'react';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  muted?: boolean;
}

export function Section({ children, muted, className = '', ...props }: SectionProps) {
  return (
    <section
      className={[
        'py-16 md:py-24 lg:py-32',
        muted ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </section>
  );
}
