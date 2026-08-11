// ============================================================
// API layer MangaDex — https://api.mangadex.org
// Semua fungsi memfilter bahasa Indonesia (translatedLanguage=id)
// ============================================================

const BASE = 'https://api.mangadex.org';

function buildUrl(path, params = {}) {
  // Catatan penting: MangaDex mengharuskan bracket [] LITERAL pada parameter
  // (mis. translatedLanguage[]=id), bukan versi ter-encode (%5B%5D).
  // URLSearchParams otomatis meng-encode bracket → menyebabkan error 400,
  // jadi query string dibangun manual di sini.
  const qs = Object.entries(params)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => `${key}=${encodeURIComponent(v)}`);
      }
      if (value !== undefined && value !== null && value !== '') {
        return [`${key}=${encodeURIComponent(value)}`];
      }
      return [];
    })
    .join('&');
  return qs ? `${BASE}${path}?${qs}` : `${BASE}${path}`;
}

// Ambil judul dengan prioritas bahasa Indonesia
function getTitle(manga, lang = 'id') {
  const titles = manga?.attributes?.title || {};
  return titles[lang] || titles.en || Object.values(titles)[0] || 'Tanpa Judul';
}

// Ambil deskripsi dengan prioritas bahasa Indonesia
function getDescription(manga, lang = 'id') {
  const desc = manga?.attributes?.description || {};
  return desc[lang] || desc.en || Object.values(desc)[0] || '';
}

// URL cover dari relationship cover_art
function getCoverUrl(manga) {
  const cover = manga?.relationships?.find((r) => r.type === 'cover_art');
  if (!cover?.attributes?.fileName) return null;
  return `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.512.jpg`;
}

// Ambil nama relasi (author/artist/scanlation_group)
function getRelationNames(manga, type) {
  return (
    manga?.relationships
      ?.filter((r) => r.type === type)
      .map((r) => r.attributes?.name || null)
      .filter(Boolean) || []
  );
}

// --- Format (Manga / Manhwa / Manhua) ---
// Catatan: MangaDex TIDAK lagi menyediakan tag format "Manga"/"Manhwa"/"Manhua"
// (tag format saat ini hanya: Oneshot, Award Winning, Official Colored, Long
// Strip, Web Comic, Adaptation, Full Color). Cara yang dipakai MangaDex sendiri
// untuk membedakan ketiganya adalah via `originalLanguage[]` (bahasa asal karya).
const FORMAT_LANGUAGES = {
  manga: 'ja', // Jepang
  manhwa: 'ko', // Korea
  manhua: 'zh', // China
};

// --- List komik (dasar) ---
// contentRating[] WAJIB untuk endpoint /manga sejak 2023 — tanpa parameter
// ini MangaDex membalas 400 Bad Request. Klien resmi selalu mengirim
// safe+suggestive+erotica (mengecualikan pornographic).
const DEFAULT_CONTENT_RATINGS = ['safe', 'suggestive', 'erotica'];

async function listManga(params) {
  // Catatan: endpoint /manga TIDAK mengenal parameter `translatedLanguage[]`
  // (menyebab 400 "property translatedLanguage is not defined").
  // Parameter yang benar adalah `availableTranslatedLanguage[]`.
  const url = buildUrl('/manga', {
    'availableTranslatedLanguage[]': ['id'],
    'includes[]': ['cover_art'],
    'contentRating[]': DEFAULT_CONTENT_RATINGS,
    ...params,
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MangaDex error: ${res.status}`);
  const data = await res.json();
  return {
    results:
      data.data?.map((m) => ({
        id: m.id,
        title: getTitle(m),
        cover: getCoverUrl(m),
        year: m.attributes.year,
        status: m.attributes.status,
      })) || [],
    total: data.total || 0,
  };
}

// Komik terbaru (chapter bahasa Indonesia terakhir diupload)
export function getLatest(limit = 24, offset = 0) {
  return listManga({ 'order[latestUploadedChapter]': 'desc', limit, offset });
}

// Komik populer (berdasarkan jumlah follow)
export function getPopular(limit = 24, offset = 0) {
  return listManga({ 'order[followedCount]': 'desc', limit, offset });
}

// Pencarian judul
export function searchManga(query, limit = 24, offset = 0) {
  return listManga({ 'order[relevance]': 'desc', title: query, limit, offset });
}

// Filter berdasarkan format: manga | manhwa | manhua
// tagId opsional = ID tag genre (dari getGenres) untuk filter tambahan
export function getByFormat(format, limit = 24, offset = 0, tagId = null) {
  const lang = FORMAT_LANGUAGES[format.toLowerCase()];
  if (!lang) throw new Error(`Format tidak dikenal: ${format}`);
  const params = {
    'order[followedCount]': 'desc',
    'originalLanguage[]': [lang],
    limit,
    offset,
  };
  if (tagId) params['includedTags[]'] = [tagId];
  return listManga(params);
}

// --- Detail manga ---
export async function getManga(id) {
  const url = buildUrl(`/manga/${id}`, {
    'includes[]': ['cover_art', 'author', 'artist'],
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MangaDex error: ${res.status}`);
  const data = await res.json();
  const m = data.data;
  return {
    id: m.id,
    title: getTitle(m),
    altTitles: (m.attributes.altTitles || [])
      .map((t) => Object.values(t)[0])
      .filter(Boolean)
      .slice(0, 5),
    description: getDescription(m),
    cover: getCoverUrl(m),
    year: m.attributes.year,
    status: m.attributes.status,
    originalLanguage: m.attributes.originalLanguage,
    authors: getRelationNames(m, 'author'),
    artists: getRelationNames(m, 'artist'),
    genres:
      (m.attributes.tags || [])
        .filter((t) => t.attributes.group === 'genre')
        .map((t) => t.attributes.name?.id || t.attributes.name?.en || '')
        .filter(Boolean) || [],
  };
}

// --- Daftar chapter bahasa Indonesia ---
export async function getChapters(mangaId, limit = 500) {
  const url = buildUrl(`/manga/${mangaId}/feed`, {
    'translatedLanguage[]': ['id'],
    'order[volume]': 'asc',
    'order[chapter]': 'asc',
    'includes[]': ['scanlation_group'],
    'contentRating[]': DEFAULT_CONTENT_RATINGS,
    limit,
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MangaDex error: ${res.status}`);
  const data = await res.json();
  return (
    data.data?.map((c) => ({
      id: c.id,
      chapter: c.attributes.chapter,
      title: c.attributes.title,
      pages: c.attributes.pages,
      publishAt: c.attributes.publishAt,
      group:
        c.relationships
          ?.filter((r) => r.type === 'scanlation_group')
          .map((r) => r.attributes?.name)
          .filter(Boolean)
          .join(', ') || 'Unknown',
    })) || []
  );
}

// --- URL gambar chapter ---
export async function getChapterImages(chapterId) {
  const url = buildUrl(`/at-home/server/${chapterId}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MangaDex error: ${res.status}`);
  const data = await res.json();
  const { baseUrl, chapter } = data;
  const files = chapter?.data || chapter?.dataSaver || [];
  return {
    baseUrl,
    hash: chapter?.hash,
    files,
    getImageUrl: (file) => `${baseUrl}/data/${chapter.hash}/${file}`,
  };
}

// --- Daftar genre (untuk filter kategori) ---
export async function getGenres() {
  const res = await fetch(buildUrl('/manga/tag'));
  const data = await res.json();
  return (
    (data.data || [])
      .filter((t) => t.attributes.group === 'genre')
      .map((t) => ({
        id: t.id,
        name: t.attributes.name?.id || t.attributes.name?.en || 'Unknown',
      })) || []
  );
}
