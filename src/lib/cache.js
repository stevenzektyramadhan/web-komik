// ============================================================
// Cache respons API di localStorage dengan TTL (time-to-live).
// Tujuan: navigasi kembali (back/forward) jadi instan, hemat
// kuota API, dan data tetap bisa dibuka saat koneksi terputus.
// ============================================================

const PREFIX = 'webkomik_cache_';

// Baca nilai cache. Kembalikan null jika tidak ada / kedaluwarsa /
// data korup / storage tidak tersedia.
export function getCache(key) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (typeof entry?.t !== 'number' || typeof entry?.v === 'undefined') return null;
    if (Date.now() > entry.t) {
      window.localStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.v;
  } catch {
    return null;
  }
}

// Simpan nilai ke cache dengan masa berlaku (ms).
export function setCache(key, value, ttlMs) {
  try {
    window.localStorage.setItem(
      PREFIX + key,
      JSON.stringify({ t: Date.now() + ttlMs, v: value })
    );
  } catch {
    // abaikan (storage penuh / private mode)
  }
}

// Hapus cache yang sudah kedaluwarsa / tidak terpakai.
// Dipanggil saat halaman dimuat agar localStorage tidak membengkak.
export function pruneCache() {
  try {
    const toRemove = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      try {
        const entry = JSON.parse(window.localStorage.getItem(key));
        if (!entry || Date.now() > entry.t) toRemove.push(key);
      } catch {
        toRemove.push(key);
      }
    }
    toRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // abaikan
  }
}
