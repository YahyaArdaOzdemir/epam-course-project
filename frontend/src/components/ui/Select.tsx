import { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = ({ className = '', children, ...props }: SelectProps) => {
  return (
    <select
      className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  );
};
