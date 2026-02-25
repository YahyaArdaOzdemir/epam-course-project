type AlertSeverity = 'success' | 'error';

type AlertProps = {
  severity: AlertSeverity;
  message: string;
};

export const Alert = ({ severity, message }: AlertProps) => {
  const isError = severity === 'error';

  return (
    <div role={isError ? 'alert' : 'status'} aria-live={isError ? 'assertive' : 'polite'}>
      {message}
    </div>
  );
};
