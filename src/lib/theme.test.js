import { beforeEach, describe, expect, it } from 'vitest';
import {
  THEME_KEY,
  getStoredTheme,
  applyTheme,
  storeTheme,
  initTheme,
  watchTheme,
} from './theme';

describe('theme helper (mode terang/gelap)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  it('default tema gelap jika belum pernah disimpan', () => {
    expect(getStoredTheme()).toBe('dark');
  });

  it('menyimpan & membaca tema terang', () => {
    storeTheme('light');
    expect(getStoredTheme()).toBe('light');
  });

  it('applyTheme menambah/menghapus class dark di <html>', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('initTheme menerapkan tema tersimpan', () => {
    storeTheme('light');
    expect(initTheme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('watchTheme mendengarkan perubahan localStorage dari tab lain', () => {
    const handler = () => {};
    const off = watchTheme(handler);
    window.dispatchEvent(
      new StorageEvent('storage', { key: THEME_KEY, newValue: '"light"' })
    );
    off(); // tidak melempar
  });
});
