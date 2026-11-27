import { useEffect, useState } from 'react';
import { STORAGE_EVENT, readKey } from '../lib/storage.js';

// Subscribes a component to one localStorage key. Re-reads on same-tab and cross-tab changes.
export function useStored(key, fallback) {
  const [value, setValue] = useState(() => readKey(key, fallback));

  useEffect(() => {
    const refresh = (event) => {
      if (event.type === 'storage' && event.key && event.key !== key) return;
      setValue(readKey(key, fallback));
    };
    window.addEventListener('storage', refresh);
    window.addEventListener(STORAGE_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(STORAGE_EVENT, refresh);
    };
    // fallback is a stable module-level constant at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return value;
}
