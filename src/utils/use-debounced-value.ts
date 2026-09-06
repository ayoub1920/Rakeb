import { useEffect, useState } from 'react';

/**
 * Dependency-free debounce for a value that drives a network call — a search
 * term, an autocomplete query. Used by `(modals)/select-place.tsx` (place
 * autocomplete) and `admin/users` (the user search box).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
