// ============================================================
// Proxy serverless Vercel untuk MangaDex API
// ------------------------------------------------------------
// MangaDex TIDAK mengirim header CORS untuk situs lain
// (lihat https://api.mangadex.org/docs/2-limitations/):
//   "We do not send CORS responses for other websites than ours;
//    MUST proxy the requests your users make to our services"
//
// Fungsi ini mem-forward request dari aplikasi (client-side)
// ke api.mangadex.org secara server-side, lalu meneruskan respons
// dengan header CORS yang diizinkan.
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
// MangaDex dilakukan di sini.
// ============================================================

const MANGA_DEX_ORIGIN = 'https://api.mangadex.org';

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

export default async function handler(req, res) {
  try {
    // Path relatif root-relative, mis. "/api/mangadex/manga?limit=1"
    const raw = stripPath(req);
    const question = raw.indexOf('?');
    const path = (question >= 0 ? raw.slice(0, question) : raw).replace(/\/+$/, '') || '/';
    // url.search mempertahankan query string asli termasuk bracket [] literal
    const search = question >= 0 ? raw.slice(question) : '';

    // Cek apakah ini request proxy MangaDex (prefix /api/mangadex)
    if (!path.startsWith('/api/mangadex')) {
      res.status(404).json({ error: 'Unknown API route' });
      return;
    }

    // Ambil path MangaDex setelah prefix, mis. /manga, /manga/{id}/feed
    const rest = path.slice('/api/mangadex'.length) || '/';
    const target = `${MANGA_DEX_ORIGIN}${rest}${search}`;

    const response = await fetch(target, {
      method: req.method || 'GET',
      headers: {
        'User-Agent': 'WebKomik/1.0 (web-komik-dun.vercel.app)',
        Accept: 'application/json',
      },
    });
    const body = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Content-Type',
      response.headers.get('content-type') || 'application/json'
    );
    res.status(response.status).send(body);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(502).json({ error: err.message });
  }
}
