import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getManga, getChapters, getChapterImages } from '../api/mangadex';
import Loading from '../components/Loading';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Baca() {
  const { id, chapterId } = useParams();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [images, setImages] = useState([]);
  const [chapterInfo, setChapterInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('scroll'); // 'scroll' | 'page'
  const [pageIdx, setPageIdx] = useState(0);
  const [imgServer, setImgServer] = useState(null); // { getImageUrl }
  // eslint-disable-next-line no-unused-vars
  const [riwayat, setRiwayat] = useLocalStorage('webkomik_riwayat', []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setPageIdx(0);
    (async () => {
      try {
        const [m, chs, img] = await Promise.all([
          getManga(id),
          getChapters(id),
          getChapterImages(chapterId),
        ]);
        if (!active) return;
        setManga(m);
        setChapters(chs);
        setImages(img.files);
        setImgServer({ getImageUrl: img.getImageUrl });
        const info = chs.find((c) => c.id === chapterId) || {
          chapter: '?',
          title: '',
        };
        setChapterInfo(info);
        // Catat riwayat baca
        setRiwayat((prev) => [
          { id, title: m.title, cover: m.cover, chapter: info.chapter, chapterId, at: Date.now() },
          ...prev.filter((r) => r.id !== id),
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
  }, [id, chapterId, setRiwayat]);

  // Scroll ke atas saat ganti chapter
  useEffect(() => {
    if (mode === 'scroll') {
      window.scrollTo({ top: 0 });
    } else {
      setPageIdx(0);
    }
  }, [chapterId, mode]);

  const idx = chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = idx > 0 ? chapters[idx - 1] : null;
  const nextChapter = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;

  if (loading) return <Loading label="Memuat chapter..." />;
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-red-400">Gagal memuat chapter: {error}</p>
        <Link to={`/komik/${id}`} className="btn-ghost mt-4">
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
              to={`/komik/${id}`}
              className="rounded px-2 py-1 text-gray-300 hover:bg-dark-700 hover:text-white"
              title="Kembali ke detail"
            >
              ←
            </Link>
            <span className="max-w-[200px] truncate font-medium sm:max-w-none">
              {manga?.title}
            </span>
            <span className="hidden text-gray-500 sm:inline">·</span>
            <span className="hidden text-accent sm:inline">
              Ch. {chapterInfo?.chapter || '?'}
              {chapterInfo?.title ? ` — ${chapterInfo.title}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
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
          <Link
            to={`/komik/${id}/baca/${prevChapter.id}`}
            className="btn-ghost"
          >
            ← Ch. {prevChapter.chapter || '?'}
          </Link>
        ) : (
          <span />
        )}
        <span className="text-sm text-gray-400">Bahasa Indonesia</span>
        {nextChapter ? (
          <Link
            to={`/komik/${id}/baca/${nextChapter.id}`}
            className="btn-primary"
          >
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
              src={imgServer.getImageUrl(img)}
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
            src={imgServer.getImageUrl(images[pageIdx])}
            alt={`Halaman ${pageIdx + 1}`}
            className="max-h-[80vh] w-auto"
          />

          <div className="mt-4 flex items-center gap-3 pb-6">
            <button
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
          <Link
            to={`/komik/${id}/baca/${prevChapter.id}`}
            className="btn-ghost"
          >
            ← Ch. {prevChapter.chapter || '?'}
          </Link>
        ) : (
          <span />
        )}
        <Link to={`/komik/${id}`} className="text-sm text-gray-400 hover:text-accent">
          Kembali ke daftar chapter
        </Link>
        {nextChapter ? (
          <Link
            to={`/komik/${id}/baca/${nextChapter.id}`}
            className="btn-primary"
          >
            Ch. {nextChapter.chapter || '?'} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
