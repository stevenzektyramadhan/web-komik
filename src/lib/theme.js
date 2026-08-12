// ============================================================
// Helper tema (mode terang / gelap) dengan persistensi
// localStorage. Tema default = 'dark' (sesuai desain asli).
// Class 'dark' dipasang di <html> supaya Tailwind darkMode:'class'
// bisa mengganti seluruh palet ke mode terang.
// ============================================================

export const THEME_KEY = 'webkomik_theme';

export function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }
  root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
}

export function storeTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme === 'light' ? 'light' : 'dark');
  } catch {
    // abaikan (private mode / storage penuh)
  }
}

// Pasang tema tersimpan begitu halaman dimuat.
export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

// Berlangganan perubahan tema dari tab lain (biar sinkron).
export function watchTheme(onChange) {
  const handler = (e) => {
    if (e.key === THEME_KEY) {
      onChange(getStoredTheme());
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
