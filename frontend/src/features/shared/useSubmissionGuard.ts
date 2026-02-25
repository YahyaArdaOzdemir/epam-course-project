import { useCallback, useState } from 'react';

export const useSubmissionGuard = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runGuarded = useCallback(async <T>(task: () => Promise<T>): Promise<T> => {
    setIsSubmitting(true);
    try {
      return await task();
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, runGuarded };
};
