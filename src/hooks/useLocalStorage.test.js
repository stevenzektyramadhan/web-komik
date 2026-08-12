import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('mengembalikan nilai awal saat storage kosong', () => {
    const { result } = renderHook(() => useLocalStorage('kunci', [1, 2]));
    expect(result.current[0]).toEqual([1, 2]);
  });

  it('membaca nilai yang sudah tersimpan', () => {
    window.localStorage.setItem('kunci', JSON.stringify({ a: 1 }));
    const { result } = renderHook(() => useLocalStorage('kunci', null));
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it('menyimpan perubahan nilai ke localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('kunci', []));
    act(() => {
      result.current[1]([3, 4]);
    });
    expect(window.localStorage.getItem('kunci')).toBe('[3,4]');
  });

  it('menangani data JSON yang korup', () => {
    window.localStorage.setItem('kunci', '{bukan json');
    const { result } = renderHook(() => useLocalStorage('kunci', 'default'));
    expect(result.current[0]).toBe('default');
  });
});
