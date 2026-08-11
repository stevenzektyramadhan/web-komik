// ============================================================
// API layer Komiku — https://komiku-rest-api.vercel.app
// Sumber komik berbahasa Indonesia tambahan di samping MangaDex.
// ============================================================
// Catatan arsitektur (hasil eksplorasi):
// - API ini mengirim header Access-Control-Allow-Origin: *, jadi
//   data JSON bisa di-fetch langsung dari browser tanpa proxy.
// - Gambar chapter dari img.komiku.org TIDAK mengirim CORS dan
//   punya anti-hotlink (403 tanpa Referer komiku.org), sehingga
//   semua URL gambar chapter direwrite ke proxy lokal
//   /api/komiku-img/... (lihat vite.config.js & api/index.js).
// - Thumbnail thumbnail.komiku.org tidak butuh proxy: tag <img>
//   tidak tunduk CORS dan server tidak anti-hotlink.
// - PENTING: slug pada /baca-chapter TIDAK selalu sama dengan slug
//   /detail-komik (contoh: "…zunousen-indonesia" vs "…zunousen").
//   Selalu gunakan slug dari apiLink chapter yang dikirim API.

const BASE = 'https://komiku-rest-api.vercel.app';

// Ubah URL gambar chapter img.komiku.org menjadi proxy lokal
// (mengatasi CORS + anti-hotlink di browser).
function proxyImageUrl(url) {
  if (typeof url !== 'string' || !url) return url;
  return url.replace(/^https?:\/\/img\.komiku\.org/, '/api/komiku-img');
}

async function fetchJson(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Komiku error: ${res.status}`);
  return res.json();
}

// --- Pencarian komik ---
// Respons: { status, message, keyword, total, data: [...] }
export async function searchKomiku(query) {
  const data = await fetchJson(`/search?q=${encodeURIComponent(query)}`);
  return {
    results:
      (data.data || []).map((m) => ({
        id: m.slug,
        slug: m.slug,
        title: m.title,
        cover: m.thumbnail,
        type: m.type,
        genre: m.genre,
      })) || [],
    total: data.total || 0,
  };
}

// --- Daftar komik per genre (dengan pagination) ---
// Respons: { success, genre, currentPage, totalManga, hasNextPage,
//            nextPageUrl, data: [...] }
export async function getKomikuByGenre(genre, page = 1) {
  const pagePath = page > 1 ? `/page/${page}` : '';
  const data = await fetchJson(`/genre/${encodeURIComponent(genre)}${pagePath}`);
  return {
    genre: data.genre,
    results:
      (data.data || []).map((m) => ({
        id: m.slug,
        slug: m.slug,
        title: m.title,
        cover: m.thumbnail,
        type: m.type,
        genre: m.genre,
        description: m.description,
      })) || [],
    total: data.totalManga || 0,
    currentPage: data.currentPage || page,
    hasNextPage: data.hasNextPage || false,
  };
}

// --- Detail komik ---
// Respons: { title, alternativeTitle, description, thumbnail, info,
//            genres, slug, chapters: [{ title, originalLink, apiLink,
//            views, date, chapterNumber }] }
export async function getKomikuDetail(slug) {
  const data = await fetchJson(`/detail-komik/${encodeURIComponent(slug)}`);
  const info = data.info || {};
  return {
    id: data.slug || slug,
    slug: data.slug || slug,
    title: data.title || 'Tanpa Judul',
    altTitles: data.alternativeTitle ? [data.alternativeTitle] : [],
    description: data.description || '',
    cover: data.thumbnail,
    type: info['Tipe:'] || null,
    authors: info['Author:'] ? [info['Author:']] : [],
    genres: data.genres || [],
    rating: info['Rating:'] || null,
    status: info['Status:'] || null,
    views: info['Pembaca:'] || null,
  };
}

// --- Daftar chapter (dari detail) ---
// Catatan: chapters[].apiLink berisi slug + nomor chapter yang benar
// untuk endpoint /baca-chapter. Ambil slug dari apiLink supaya selalu
// konsisten (bisa berbeda dari slug detail).
export async function getKomikuChapters(slug) {
  const data = await fetchJson(`/detail-komik/${encodeURIComponent(slug)}`);
  const chapters = data.chapters || [];
  return chapters.map((c) => {
    const apiLink = c.apiLink || '';
    const parts = apiLink.split('/').filter(Boolean); // ["baca-chapter", slug, chapter]
    const chapter = parts[parts.length - 1] || c.chapterNumber || c.title || '?';
    const chapterSlug = parts.length > 2 ? parts[parts.length - 2] : slug;
    return {
      chapter,
      slug: chapterSlug,
      title: c.title || '',
      date: c.date || '',
      views: c.views || '',
      // URL proxy lokal untuk endpoint baca
      href: apiLink || null,
    };
  });
}

// --- Gambar chapter ---
// Pakai slug + nomor chapter dari apiLink (getKomikuChapters).
// Respons: { title, mangaInfo, description, chapterInfo, images,
//            meta, navigation, additionalDescription }
export async function getKomikuChapterImages(slug, chapter) {
  const data = await fetchJson(
    `/baca-chapter/${encodeURIComponent(slug)}/${encodeURIComponent(chapter)}`
  );
  // PENTING: rewrite semua URL img.komiku.org → /api/komiku-img DI SINI,
  // bukan di komponen. Reader memakai images mentah (`img?.src || img`),
  // jadi kalau tidak di-proxy di layer ini, browser tetap request langsung
  // ke img.komiku.org → kena anti-hotlink (403) + OpaqueResponseBlocking.
  const images = (data.images || []).map((img) => {
    if (typeof img === 'string') return proxyImageUrl(img);
    const proxied = proxyImageUrl(img?.src || img?.url || '');
    return proxied ? { ...img, src: proxied } : img;
  });
  return {
    title: data.title || '',
    mangaInfo: data.mangaInfo || null,
    chapterInfo: data.chapterInfo || null,
    images,
    getImageUrl: (img) =>
      proxyImageUrl(typeof img === 'string' ? img : img?.src || img?.url || ''),
  };
}
