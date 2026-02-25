import { HTMLAttributes, PropsWithChildren } from 'react';

type BadgeProps = PropsWithChildren<HTMLAttributes<HTMLSpanElement>>;

export const Badge = ({ children, className = '', ...props }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};
