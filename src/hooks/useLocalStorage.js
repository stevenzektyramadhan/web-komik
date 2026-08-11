import { useState, useEffect } from 'react';

// Hook localStorage sederhana untuk favorit & riwayat baca
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // abaikan error (mis. storage penuh / private mode)
    }
  }, [key, value]);

  return [value, setValue];
}
