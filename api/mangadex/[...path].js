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
// dengan header CORS yang diizinkan. Vercel otomatis memetakan
// file ini ke route: /api/mangadex/*
// ============================================================

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    // Ambil path setelah /api/mangadex/ (mis. /manga, /manga/tag, /at-home/server/xxx)
    const rest = url.pathname.replace(/^\/api\/mangadex\/?/, '');
    // url.search mempertahankan query string asli termasuk bracket [] literal
    const target = `https://api.mangadex.org/${rest}${url.search}`;

    const response = await fetch(target, {
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
