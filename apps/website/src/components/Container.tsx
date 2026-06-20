import type { ReactNode, HTMLAttributes } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  narrow?: boolean;
}

export function Container({ children, narrow, className = '', ...props }: ContainerProps) {
  return (
    <div
      className={[
        'mx-auto w-full px-6 lg:px-8',
        narrow ? 'max-w-4xl' : 'max-w-7xl',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
