import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ children, hover, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60 dark:shadow-slate-950/20',
        hover ? 'transition-shadow duration-200 hover:shadow-md dark:hover:shadow-slate-950/40' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
