// ============================================================
// Proxy serverless Vercel untuk MangaDex & Komiku API + gambar
// ------------------------------------------------------------
// MangaDex TIDAK mengirim header CORS untuk situs lain
// (lihat https://api.mangadex.org/docs/2-limitations/):
//   "We do not send CORS responses for other websites than ours;
//    MUST proxy the requests your users make to our services"
//
// Tiga fungsi:
//   /api/mangadex/*    → api.mangadex.org      (data JSON)
//   /api/img/*         → uploads.mangadex.org  (cover & halaman chapter)
//   /api/komiku-img/*  → img.komiku.org        (gambar chapter Komiku)
// uploads.mangadex.org & img.komiku.org memberlakukan anti-hotlink
// (menolak gambar yang diambil langsung dari domain lain), jadi gambar
// juga harus diproxy. img.komiku.org butuh header Referer komiku.org.
//
// PENTING — kenapa bukan api/mangadex/[...path].js?
// Catch-all `[...path]` di Vercel HANYA mencocokkan path 1-segmen
// (mis. /api/mangadex/manga), bukan path bertingkat seperti
// /api/mangadex/manga/{id}/feed atau /api/mangadex/at-home/server/{id}
// → mereka 404 di level routing sebelum sampai ke fungsi.
// Vercel juga menyuntikkan query `___path` pada route catch-all,
// yang DITOLAK MangaDex (error "property ___path is not defined").
//
// Solusi: satu fungsi di api/index.js + rewrite vercel.json:
//   { "source": "/api/(.*)", "destination": "/api/index" }
// Semua request /api/* diarahkan ke fungsi ini; pemetaan path
// dilakukan di sini.
// ============================================================

const API_ORIGIN = 'https://api.mangadex.org';
const UPLOADS_ORIGIN = 'https://uploads.mangadex.org';
const KOMIKU_IMG_ORIGIN = 'https://img.komiku.org';

const stripPath = (req) => {
  let raw = req.url;
  if (raw.startsWith('http')) {
    try {
      raw = new URL(raw).pathname + (new URL(raw).search || '');
    } catch {
      raw = req.url;
    }
  }
  return raw;
};

// Pilih origin target berdasarkan prefix path request.
const route = (path) => {
  if (path.startsWith('/api/mangadex')) {
    return { origin: API_ORIGIN, rest: path.slice('/api/mangadex'.length) || '/' };
  }
  if (path.startsWith('/api/img')) {
    return { origin: UPLOADS_ORIGIN, rest: path.slice('/api/img'.length) || '/' };
  }
  if (path.startsWith('/api/komiku-img')) {
    return { origin: KOMIKU_IMG_ORIGIN, rest: path.slice('/api/komiku-img'.length) || '/' };
  }
  return null;
};

export default async function handler(req, res) {
  try {
    // Path relatif root-relative, mis. "/api/mangadex/manga?limit=1"
    const raw = stripPath(req);
    const question = raw.indexOf('?');
    const path = (question >= 0 ? raw.slice(0, question) : raw).replace(/\/+$/, '') || '/';
    // url.search mempertahankan query string asli termasuk bracket [] literal
    const search = question >= 0 ? raw.slice(question) : '';

    const r = route(path);
    if (!r) {
      res.status(404).json({ error: 'Unknown API route' });
      return;
    }

    const target = `${r.origin}${r.rest}${search}`;
    const isImage = r.origin === UPLOADS_ORIGIN || r.origin === KOMIKU_IMG_ORIGIN;
    const headers = {
      'User-Agent': 'WebKomik/1.0 (web-komik-dun.vercel.app)',
      Accept: isImage
        ? 'image/avif,image/webp,image/jpeg,image/png,*/*'
        : 'application/json',
    };
    // img.komiku.org anti-hotlink: butuh Referer komiku.org agar tidak 403.
    if (r.origin === KOMIKU_IMG_ORIGIN) {
      headers.Referer = 'https://komiku.org/';
    }

    const response = await fetch(target, {
      method: req.method || 'GET',
      headers,
    });

    const contentType =
      response.headers.get('content-type') || (isImage ? 'image/jpeg' : 'application/json');
    // Untuk gambar, teruskan body binary apa adanya.
    const body = isImage ? Buffer.from(await response.arrayBuffer()) : await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    if (isImage) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    res.status(response.status).send(body);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(502).json({ error: err.message });
  }
}

