import { describe, expect, it } from 'vitest';
import { formatPosisi, progressPersen } from '../lib/format';

describe('formatPosisi', () => {
  it('memformat posisi mode halaman', () => {
    expect(formatPosisi({ pageIdx: 2, totalPages: 20 })).toBe('Hlm. 3/20');
  });

  it('membatasi halaman tidak melebihi total', () => {
    expect(formatPosisi({ pageIdx: 99, totalPages: 20 })).toBe('Hlm. 20/20');
  });

  it('memformat posisi mode scroll (persen)', () => {
    expect(formatPosisi({ progress: 50 })).toBe('50%');
  });

  it('membatasi persen scroll di 99%', () => {
    expect(formatPosisi({ progress: 123 })).toBe('99%');
  });

  it('mengembalikan string kosong jika posisi tidak tersedia', () => {
    expect(formatPosisi({})).toBe('');
    expect(formatPosisi(null)).toBe('');
    expect(formatPosisi(undefined)).toBe('');
  });
});

describe('progressPersen', () => {
  it('menghitung persen dari mode halaman', () => {
    expect(progressPersen({ pageIdx: 0, totalPages: 10 })).toBe(10);
    expect(progressPersen({ pageIdx: 9, totalPages: 10 })).toBe(100);
  });

  it('memakai nilai progress langsung untuk mode scroll', () => {
    expect(progressPersen({ progress: 50 })).toBe(50);
    expect(progressPersen({ progress: 100.5 })).toBe(100);
  });

  it('mengembalikan null jika posisi tidak tersedia', () => {
    expect(progressPersen({})).toBeNull();
    expect(progressPersen(null)).toBeNull();
  });
});
