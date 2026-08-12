import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getKomikuChapterImages, getKomikuChapters, getKomikuDetail } from '../api/komiku';
import Loading from '../components/Loading';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePageMeta } from '../hooks/usePageMeta';

export default function KomikuBaca() {
  const { slug, chapter } = useParams();
  const [searchParams] = useSearchParams();
  // cs = slug chapter yang benar untuk endpoint /baca-chapter (bisa berbeda
  // dari slug detail). Selalu dikirim dari daftar chapter di KomikuDetail.
  const csQuery = searchParams.get('cs');

  const [manga, setManga] = useState(null);
  const [chapterSlug, setChapterSlug] = useState(csQuery || null);
  const [images, setImages] = useState([]);
  const [navigation, setNavigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('scroll'); // 'scroll' | 'page'
  const [pageIdx, setPageIdx] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [riwayat, setRiwayat] = useLocalStorage('webkomik_riwayat', []);

  // Kalau dibuka tanpa ?cs (mis. dari Riwayat), resolve slug chapter dari
  // daftar chapter detail.
  useEffect(() => {
    let active = true;
    if (csQuery) {
      setChapterSlug(csQuery);
      return undefined;
    }
    getKomikuChapters(slug)
      .then((chs) => {
        if (!active) return;
        const found = chs.find((c) => c.chapter === chapter);
        setChapterSlug(found?.slug || slug);
      })
      .catch(() => {
        if (active) setChapterSlug(slug);
      });
    return () => {
      active = false;
    };
  }, [slug, chapter, csQuery]);

  useEffect(() => {
    if (!chapterSlug) return;
    let active = true;
    setLoading(true);
    setError(null);
    setPageIdx(0);
    (async () => {
      try {
        const [img, detail] = await Promise.all([
          getKomikuChapterImages(chapterSlug, chapter),
          getKomikuDetail(slug),
        ]);
        if (!active) return;
        setImages(img.images);
        setNavigation(img.navigation || null);
        setManga(detail);
        // Catat riwayat baca (id = slug detail, source = komiku)
        setRiwayat((prev) => [
          {
            id: slug,
            title: detail.title,
            cover: detail.cover,
            chapter,
            chapterId: chapter,
            source: 'komiku',
            at: Date.now(),
          },
          ...prev.filter((r) => r.id !== slug),
        ].slice(0, 50));
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [chapterSlug, slug, chapter, setRiwayat]);

  // Scroll ke atas saat ganti chapter
  useEffect(() => {
    if (mode === 'scroll') {
      window.scrollTo({ top: 0 });
    } else {
      setPageIdx(0);
    }
  }, [chapter, mode]);

  const prevChapter = navigation?.prevChapter || null;
  const nextChapter = navigation?.nextChapter || null;
  const chapterTo = (c) =>
    c ? `/komiku/${slug}/baca/${c.chapter}?cs=${encodeURIComponent(c.slug)}` : null;

  // SEO: judul & deskripsi chapter yang sedang dibaca
  usePageMeta(
    manga ? `Ch. ${chapter} — ${manga.title} — WebKomik` : 'Membaca — WebKomik',
    'Baca komik manga, manhwa, dan manhua bahasa Indonesia secara gratis di WebKomik.'
  );

  if (loading) return <Loading label="Memuat chapter Komiku..." />;
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-red-400">Gagal memuat chapter: {error}</p>
        <Link to={`/komiku/${slug}`} className="btn-ghost mt-4">
          Kembali ke Detail
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-0 py-0">
      {/* Toolbar */}
      <div className="sticky top-0 z-40 border-b border-dark-700 bg-dark-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <Link
              to={`/komiku/${slug}`}
              className="rounded px-2 py-1 text-gray-300 hover:bg-dark-700 hover:text-white"
              title="Kembali ke detail"
            >
              ←
            </Link>
            <span className="max-w-[200px] truncate font-medium sm:max-w-none">
              {manga?.title}
            </span>
            <span className="hidden text-gray-500 sm:inline">·</span>
            <span className="hidden text-accent sm:inline">Ch. {chapter || '?'}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode('scroll')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                mode === 'scroll'
                  ? 'bg-accent text-white'
                  : 'border border-dark-600 text-gray-300 hover:border-accent'
              }`}
            >
              📜 Scroll
            </button>
            <button
              type="button"
              onClick={() => setMode('page')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                mode === 'page'
                  ? 'bg-accent text-white'
                  : 'border border-dark-600 text-gray-300 hover:border-accent'
              }`}
            >
              📄 Halaman
            </button>
          </div>
        </div>
      </div>

      {/* Navigasi atas */}
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4">
        {prevChapter ? (
          <Link to={chapterTo(prevChapter)} className="btn-ghost px-2 text-xs sm:px-4 sm:text-sm">
            ← Ch. {prevChapter.chapter || '?'}
          </Link>
        ) : (
          <span />
        )}
        <span className="hidden text-sm text-gray-400 sm:inline">Bahasa Indonesia</span>
        {nextChapter ? (
          <Link to={chapterTo(nextChapter)} className="btn-primary px-2 text-xs sm:px-4 sm:text-sm">
            Ch. {nextChapter.chapter || '?'} →
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Mode Scroll Vertikal */}
      {mode === 'scroll' ? (
        <div className="flex flex-col items-center">
          {images.map((img, i) => (
            <img
              key={i}
              src={img?.src || img}
              alt={`Halaman ${i + 1}`}
              loading="lazy"
              className="w-full max-w-3xl"
            />
          ))}
        </div>
      ) : (
        /* Mode Halaman */
        <div className="relative flex flex-col items-center">
          <img
            src={images[pageIdx]?.src || images[pageIdx]}
            alt={`Halaman ${pageIdx + 1}`}
            className="max-h-[80vh] w-auto"
          />

          <div className="mt-4 flex items-center gap-3 pb-6">
            <button
              type="button"
              onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
              disabled={pageIdx === 0}
              className="btn-ghost"
            >
              ← Sebelumnya
            </button>
            <span className="text-sm text-gray-400">
              {pageIdx + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setPageIdx((p) => Math.min(images.length - 1, p + 1))}
              disabled={pageIdx >= images.length - 1}
              className="btn-primary"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}

      {/* Navigasi bawah */}
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-6">
        {prevChapter ? (
          <Link to={chapterTo(prevChapter)} className="btn-ghost px-2 text-xs sm:px-4 sm:text-sm">
            ← Ch. {prevChapter.chapter || '?'}
          </Link>
        ) : (
          <span />
        )}
        <Link
          to={`/komiku/${slug}`}
          className="hidden text-sm text-gray-400 hover:text-accent sm:inline"
        >
          Kembali ke daftar chapter
        </Link>
        {nextChapter ? (
          <Link to={chapterTo(nextChapter)} className="btn-primary px-2 text-xs sm:px-4 sm:text-sm">
            Ch. {nextChapter.chapter || '?'} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
