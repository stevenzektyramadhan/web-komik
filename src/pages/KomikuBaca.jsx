import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getKomikuChapterImages, getKomikuChapters, getKomikuDetail } from '../api/komiku';
import Loading from '../components/Loading';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePageMeta } from '../hooks/usePageMeta';

const READER_MODE_KEY = 'webkomik_reader_mode';

function getSavedMode() {
  try {
    const m = window.localStorage.getItem(READER_MODE_KEY);
    return m === 'page' ? 'page' : 'scroll';
  } catch {
    return 'scroll';
  }
}

export default function KomikuBaca() {
  const { slug, chapter } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // cs = slug chapter yang benar untuk endpoint /baca-chapter (bisa berbeda
  // dari slug detail). Selalu dikirim dari daftar chapter di KomikuDetail.
  const csQuery = searchParams.get('cs');

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chapterSlug, setChapterSlug] = useState(csQuery || null);
  const [images, setImages] = useState([]);
  const [navigation, setNavigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(getSavedMode); // 'scroll' | 'page'
  const [pageIdx, setPageIdx] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [riwayat, setRiwayat] = useLocalStorage('webkomik_riwayat', []);
  const scrollRef = useRef(0); // posisi scroll untuk menyimpan kemajuan
  const [autoLoading, setAutoLoading] = useState(false); // auto-load chapter berikutnya
  const autoLoadingRef = useRef(false);
  const suppressAutoLoadRef = useRef(false); // cegah auto-load beruntun saat restore posisi

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
        setChapters(chs);
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

  // Simpan preferensi mode reader yang dipilih user.
  useEffect(() => {
    try {
      window.localStorage.setItem(READER_MODE_KEY, mode);
    } catch {
      // abaikan (storage penuh / private mode)
    }
  }, [mode]);

  useEffect(() => {
    if (!chapterSlug) return;
    let active = true;
    setLoading(true);
    setError(null);
    setPageIdx(0);
    scrollRef.current = 0;
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
        // Restore posisi baca terakhir untuk chapter yang sama.
        try {
          const raw = window.localStorage.getItem('webkomik_riwayat');
          const list = raw ? JSON.parse(raw) : [];
          const saved = list.find((r) => r.id === slug && r.chapterId === chapter);
          if (saved && img.images.length) {
            if (typeof saved.pageIdx === 'number' && saved.totalPages) {
              setPageIdx(Math.min(saved.pageIdx, img.images.length - 1));
            } else if (typeof saved.progress === 'number' && saved.progress > 0) {
              // Batasi ke 90% supaya tidak langsung memicu auto-load chapter
              // berikutnya; sambil itu, tahan auto-load sementara (suppress).
              suppressAutoLoadRef.current = true;
              setTimeout(() => {
                const maxScroll = Math.max(
                  1,
                  document.documentElement.scrollHeight - window.innerHeight
                );
                window.scrollTo({ top: Math.min(0.9, saved.progress / 100) * maxScroll });
              }, 400);
            }
          }
        } catch {
          // abaikan (localStorage tidak tersedia / data korup)
        }
        // Daftar chapter untuk dropdown (kalau belum ter-load karena ?cs).
        if (chapters.length === 0) {
          getKomikuChapters(slug)
            .then((chs) => {
              if (active) setChapters(chs);
            })
            .catch(() => {});
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterSlug, slug, chapter, setRiwayat]);

  // Scroll ke atas saat ganti chapter
  useEffect(() => {
    if (mode === 'scroll') {
      window.scrollTo({ top: 0 });
    } else {
      setPageIdx(0);
    }
  }, [chapter, mode]);

  // Prev/Next dihitung dari daftar chapter lengkap (getKomikuChapters) supaya
  // tombol selalu muncul — `navigation` dari API /baca-chapter sering null pada
  // chapter terakhir / chapter yang slug-nya tidak sama dengan slug detail.
  // Daftar chapter berurutan menurun (terbaru dulu): prev = indeks sesudahnya
  // (chapter yang lebih tinggi), next = indeks sebelumnya (chapter lebih rendah).
  const chapterIdx = chapters.findIndex((c) => c.chapter === chapter);
  const prevChapter =
    chapterIdx >= 0 && chapterIdx < chapters.length - 1
      ? chapters[chapterIdx + 1]
      : navigation?.prevChapter || null;
  const nextChapter =
    chapterIdx > 0
      ? chapters[chapterIdx - 1]
      : navigation?.nextChapter || null;
  const chapterTo = (c) =>
    c ? `/komiku/${slug}/baca/${c.chapter}?cs=${encodeURIComponent(c.slug)}` : null;

  // SEO: judul & deskripsi chapter yang sedang dibaca
  usePageMeta(
    manga ? `Ch. ${chapter} — ${manga.title} — WebKomik` : 'Membaca — WebKomik',
    'Baca komik manga, manhwa, dan manhua bahasa Indonesia secara gratis di WebKomik.'
  );

  // Simpan posisi baca ke riwayat: langsung saat ganti chapter,
  // dan (mode scroll) di-throttle 2 detik saat scroll berhenti.
  const saveProgress = () => {
    if (!manga) return;
    const total = images.length || 1;
    let progress = 0;
    if (mode === 'page') {
      progress = total ? Math.min(99, Math.round(((pageIdx + 1) / total) * 100)) : 0;
    } else {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      progress = Math.min(99, Math.round(((scrollRef.current || 0) / maxScroll) * 100));
    }
    setRiwayat((prev) => [
      {
        id: slug,
        title: manga.title,
        cover: manga.cover,
        chapter,
        chapterId: chapter,
        source: 'komiku',
        pageIdx: mode === 'page' ? pageIdx : undefined,
        totalPages: mode === 'page' ? total : undefined,
        progress,
        at: Date.now(),
      },
      ...prev.filter((r) => r.id !== slug),
    ].slice(0, 50));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveProgressRef = useRef(saveProgress);
  saveProgressRef.current = saveProgress;

  // Mode halaman: catat posisi saat berpindah page.
  useEffect(() => {
    if (mode === 'page' && images.length > 0) saveProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdx, mode, images.length]);

  // Mode scroll: simpan saat scroll berhenti (throttle 2 detik).
  useEffect(() => {
    if (mode !== 'scroll') return undefined;
    let timer = null;
    const onScroll = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        scrollRef.current = window.scrollY || 0;
        saveProgressRef.current();
      }, 2000);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [mode]);

  // Auto-load chapter berikutnya (mode scroll): saat user mendekati bagian
  // bawah (≥90% tinggi halaman) dan ada chapter berikutnya, otomatis pindah
  // ke chapter itu tanpa klik. Dipasang di window scroll supaya berfungsi
  // juga saat tinggi dokumen berubah setelah gambar selesai dimuat.
  // nextChapter disimpan di ref supaya listener scroll tetap terpasang
  // (tidak di-mount ulang) dan tidak memicu beruntun saat chapter berganti.
  // suppressAutoLoadRef menahan trigger saat posisi dipulihkan dari riwayat.
  const autoLoadRef = useRef(null);
  autoLoadRef.current = nextChapter;
  useEffect(() => {
    if (mode !== 'scroll') return undefined;
    const checkAutoLoad = () => {
      const nc = autoLoadRef.current;
      if (suppressAutoLoadRef.current || !nc || autoLoadingRef.current) return;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const pos = (window.scrollY || 0) / maxScroll;
      if (pos >= 0.9) {
        autoLoadingRef.current = true;
        setAutoLoading(true);
        navigate(chapterTo(nc));
      }
    };
    window.addEventListener('scroll', checkAutoLoad, { passive: true });
    return () => window.removeEventListener('scroll', checkAutoLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, slug, navigate]);

  // Reset flag auto-load & suppress saat chapter berganti.
  useEffect(() => {
    autoLoadingRef.current = false;
    suppressAutoLoadRef.current = false;
    setAutoLoading(false);
  }, [chapter]);

  // Keyboard navigasi: ← / → pindah halaman (mode halaman) atau
  // ganti chapter (mode scroll); Home/End lompat awal/akhir.
  // Tidak aktif saat fokus di input/textarea/select.
  useEffect(() => {
    const goPrev = () => {
      if (mode === 'page') {
        if (pageIdx > 0) setPageIdx((p) => Math.max(0, p - 1));
        else if (prevChapter) navigate(chapterTo(prevChapter));
      } else if (prevChapter) {
        navigate(chapterTo(prevChapter));
      }
    };
    const goNext = () => {
      if (mode === 'page') {
        if (pageIdx < images.length - 1)
          setPageIdx((p) => Math.min(images.length - 1, p + 1));
        else if (nextChapter) navigate(chapterTo(nextChapter));
      } else if (nextChapter) {
        navigate(chapterTo(nextChapter));
      }
    };
    const onKey = (e) => {
      const t = e.target;
      if (
        t &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (mode === 'page') setPageIdx(0);
        else window.scrollTo({ top: 0 });
      } else if (e.key === 'End') {
        e.preventDefault();
        if (mode === 'page') setPageIdx(images.length - 1);
        else window.scrollTo({ top: document.documentElement.scrollHeight });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pageIdx, prevChapter, nextChapter, slug, images.length, chapter]);

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
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-dark-700 dark:bg-dark-950/95">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <Link
              to={`/komiku/${slug}`}
              className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-700 dark:hover:text-white"
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

          <div className="flex flex-wrap items-center justify-end gap-1">
            {prevChapter && (
              <Link
                to={chapterTo(prevChapter)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-600 transition hover:border-accent hover:text-accent dark:border-dark-600 dark:text-gray-300"
                title={`Ke chapter sebelumnya (Ch. ${prevChapter.chapter || '?'})`}
              >
                ← Ch. {prevChapter.chapter || '?'}
              </Link>
            )}
            {nextChapter && (
              <Link
                to={chapterTo(nextChapter)}
                className="rounded-lg bg-accent px-2 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                title={`Ke chapter berikutnya (Ch. ${nextChapter.chapter || '?'})`}
              >
                Ch. {nextChapter.chapter || '?'} →
              </Link>
            )}
            <select
              aria-label="Pilih chapter"
              value={chapter}
              onChange={(e) => {
                const target = chapters.find((c) => c.chapter === e.target.value);
                navigate(
                  target
                    ? `/komiku/${slug}/baca/${target.chapter}?cs=${encodeURIComponent(target.slug)}`
                    : `/komiku/${slug}/baca/${e.target.value}`
                );
              }}
              className="input-field !w-auto !py-1.5 !px-2 text-xs"
            >
              {chapters.length > 0 ? (
                chapters.map((c) => (
                  <option key={c.chapter} value={c.chapter}>
                    Ch. {c.chapter || '?'}{c.title ? ` — ${c.title}` : ''}
                  </option>
                ))
              ) : (
                <option value={chapter}>Ch. {chapter || '?'}</option>
              )}
            </select>
            <button
              type="button"
              onClick={() => setMode('scroll')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                mode === 'scroll'
                  ? 'bg-accent text-white'
                  : 'border border-gray-300 text-gray-600 hover:border-accent dark:border-dark-600 dark:text-gray-300'
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
                  : 'border border-gray-300 text-gray-600 hover:border-accent dark:border-dark-600 dark:text-gray-300'
              }`}
            >
              📄 Halaman
            </button>
          </div>
        </div>
      </div>

      {/* Tombol prev/next selalu terlihat (sticky di sisi kiri/kanan) */}
      <div className="pointer-events-none fixed inset-y-0 left-2 z-40 hidden items-center lg:flex">
        <div className="pointer-events-auto -translate-x-16 opacity-0 transition-all duration-200 hover:translate-x-0 hover:opacity-100 lg:opacity-40">
          {prevChapter ? (
            <Link
              to={chapterTo(prevChapter)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-xl text-gray-700 shadow-lg transition hover:border-accent hover:text-accent dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200"
              title={`Ke chapter sebelumnya (Ch. ${prevChapter.chapter || '?'})`}
            >
              ‹
            </Link>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none fixed inset-y-0 right-2 z-40 hidden items-center lg:flex">
        <div className="pointer-events-auto translate-x-16 opacity-0 transition-all duration-200 hover:translate-x-0 hover:opacity-100 lg:opacity-40">
          {nextChapter ? (
            <Link
              to={chapterTo(nextChapter)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-xl text-gray-700 shadow-lg transition hover:border-accent hover:text-accent dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200"
              title={`Ke chapter berikutnya (Ch. ${nextChapter.chapter || '?'})`}
            >
              ›
            </Link>
          ) : null}
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
        <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">Bahasa Indonesia</span>
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
          {nextChapter && (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {autoLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-accent dark:border-dark-600" />
                  Memuat chapter berikutnya...
                </span>
              ) : (
                <Link to={chapterTo(nextChapter)} className="hover:text-accent">
                  Lanjut ke Ch. {nextChapter.chapter || '?'} →
                </Link>
              )}
            </div>
          )}
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
            <span className="text-sm text-gray-500 dark:text-gray-400">
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
          className="hidden text-sm text-gray-500 hover:text-accent dark:text-gray-400 sm:inline"
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
