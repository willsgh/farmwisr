import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data each time the screen comes into focus, so lists refresh after returning from a form.
 * `key` identifies what is loaded (e.g. a route id); a new key triggers a reload.
 */
export function useFocusLoad<T>(load: () => Promise<T>, key = '') {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadRef
        .current()
        .then((result) => {
          if (!active) return;
          setData(result);
          setError(null);
        })
        .catch((e: unknown) => {
          if (active) setError(e instanceof Error ? e.message : 'Something went wrong.');
        });
      return () => {
        active = false;
      };
      // `key` is the only dependency: a new key (another route id) must reload even though the callback doesn't read it.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]),
  );

  return { data, error };
}
