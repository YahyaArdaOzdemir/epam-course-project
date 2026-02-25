import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: ButtonVariant;
};

export const Button = ({
  children,
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) => {
  const variantClassName =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
      : 'border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50';

  return (
    <button
      type={type}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed ${variantClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};
