type AlertSeverity = 'success' | 'error';

type AlertProps = {
  severity: AlertSeverity;
  message: string;
  id?: string;
  className?: string;
};

export const Alert = ({ severity, message, id, className = '' }: AlertProps) => {
  const isError = severity === 'error';
  const toneClassName = isError
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-green-200 bg-green-50 text-green-700';

  return (
    <div
      id={id}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`rounded-md border px-4 py-3 text-sm shadow-sm ${toneClassName} ${className}`.trim()}
    >
      {message}
    </div>
  );
};
