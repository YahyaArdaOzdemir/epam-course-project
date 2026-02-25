import { forwardRef } from 'react';

type AlertVariant = 'destructive' | 'success';
type AlertSeverity = 'error' | 'success';

type AlertProps = {
  variant?: AlertVariant;
  severity?: AlertSeverity;
  message: string;
  id?: string;
  className?: string;
};

/** Shared in-page feedback banner supporting destructive (error) and success states. */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant, severity, message, id, className = '' },
  ref,
) {
  const normalizedVariant = variant ?? (severity === 'error' ? 'destructive' : 'success');
  const isDestructive = normalizedVariant === 'destructive';
  const toneClassName = isDestructive
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-green-200 bg-green-50 text-green-700';

  return (
    <div
      id={id}
      ref={ref}
      tabIndex={-1}
      role={isDestructive ? 'alert' : 'status'}
      aria-live={isDestructive ? 'assertive' : 'polite'}
      className={`rounded-md border px-4 py-3 text-sm shadow-sm ${toneClassName} ${className}`.trim()}
    >
      {message}
    </div>
  );
});
