import { useState, useEffect, useRef } from 'react';

export function useStableState<T>(initialValue: T, delay: number = 100) {
  const [value, setValue] = useState<T>(initialValue);
  const [stableValue, setStableValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setStableValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return [stableValue, setValue] as const;
}
