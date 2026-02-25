import { useCallback, useRef, useState } from 'react';

export const useSubmissionGuard = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inFlightTaskRef = useRef<Promise<unknown> | null>(null);

  const runGuarded = useCallback(async <T>(task: () => Promise<T>): Promise<T> => {
    if (inFlightTaskRef.current) {
      return inFlightTaskRef.current as Promise<T>;
    }

    setIsSubmitting(true);
    const taskPromise = task().finally(() => {
      inFlightTaskRef.current = null;
      setIsSubmitting(false);
    });

    inFlightTaskRef.current = taskPromise;
    return taskPromise;
  }, []);

  return { isSubmitting, runGuarded };
};
