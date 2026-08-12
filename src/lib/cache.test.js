import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCache, setCache, pruneCache } from './cache';

describe('cache API (localStorage + TTL)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it('menyimpan & membaca nilai', () => {
    setCache('manga-list', [{ id: 1 }], 60_000);
    expect(getCache('manga-list')).toEqual([{ id: 1 }]);
  });

  it('mengembalikan null untuk kunci yang tidak ada', () => {
    expect(getCache('tidak-ada')).toBeNull();
  });

  it('menghapus entri yang sudah kedaluwarsa', () => {
    setCache('expired', 'x', 10); // TTL 10 ms
    expect(getCache('expired')).toBe('x');
  });

  it('menghapus entri kedaluwarsa dan mengembalikan null', () => {
    setCache('expired', 'x', 1000);
    vi.useFakeTimers();
    vi.advanceTimersByTime(2000);
    expect(getCache('expired')).toBeNull();
  });

  it('pruneCache membersihkan hanya entri yang kedaluwarsa', () => {
    setCache('a', 1, 1000);
    setCache('b', 2, 1000);
    vi.useFakeTimers();
    vi.advanceTimersByTime(2000);
    setCache('c', 3, 60_000);
    pruneCache();
    expect(getCache('a')).toBeNull();
    expect(getCache('b')).toBeNull();
    expect(getCache('c')).toEqual(3);
  });

  it('mengabaikan data korup (bukan JSON)', () => {
    window.localStorage.setItem('webkomik_cache_corrupt', '{invalid');
    expect(getCache('corrupt')).toBeNull();
  });
});
