// ============================================================
// Helper format posisi baca dari riwayat (dipakai bersama di
// halaman Riwayat & widget Lanjutkan Baca, serta unit test).
// ============================================================

// "Hlm. 3/20" (mode halaman) atau "50%" (mode scroll).
// Mengembalikan string kosong jika posisi belum tersedia.
export function formatPosisi(r) {
  if (typeof r?.pageIdx === 'number' && r.totalPages) {
    return `Hlm. ${Math.min(r.pageIdx + 1, r.totalPages)}/${r.totalPages}`;
  }
  if (typeof r?.progress === 'number') {
    return `${Math.max(0, Math.min(99, r.progress))}%`;
  }
  return '';
}

// Persentase progress (0–100) untuk progress bar.
// Mengembalikan null jika posisi belum tersedia.
export function progressPersen(r) {
  if (typeof r?.pageIdx === 'number' && r.totalPages) {
    return Math.max(
      0,
      Math.min(100, Math.round(((r.pageIdx + 1) / r.totalPages) * 100))
    );
  }
  if (typeof r?.progress === 'number') {
    return Math.max(0, Math.min(100, Math.round(r.progress)));
  }
  return null;
}
