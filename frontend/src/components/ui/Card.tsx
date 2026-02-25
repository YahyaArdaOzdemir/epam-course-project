import { HTMLAttributes, PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export const Card = ({ children, className = '', ...props }: CardProps) => {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};
