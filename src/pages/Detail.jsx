import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getManga, getChapters } from '../api/mangadex';
import Loading from '../components/Loading';
import { useLocalStorage } from '../hooks/useLocalStorage';

function formatTanggal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Detail() {
  const { id } = useParams();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorit, setFavorit] = useLocalStorage('webkomik_favorit', []);

  const isFavorit = favorit.some((f) => f.id === id);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const [m, c] = await Promise.all([getManga(id), getChapters(id)]);
        if (!active) return;
        setManga(m);
        setChapters(c);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const toggleFavorit = () => {
    if (isFavorit) {
      setFavorit(favorit.filter((f) => f.id !== id));
    } else {
      setFavorit([
        ...favorit,
        { id: manga.id, title: manga.title, cover: manga.cover },
      ]);
    }
  };

  if (loading) return <Loading label="Memuat detail komik..." />;
  if (error) return <p className="p-8 text-red-400">Gagal memuat: {error}</p>;
  if (!manga) return <p className="p-8 text-gray-400">Komik tidak ditemukan.</p>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-6 md:flex-row">
        {/* Cover */}
        <div className="w-48 shrink-0 overflow-hidden rounded-xl border border-dark-700 md:w-56">
          {manga.cover ? (
            <img src={manga.cover} alt={manga.title} className="w-full" />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center bg-dark-800 text-5xl">
              📕
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold md:text-3xl">{manga.title}</h1>

          {manga.altTitles?.length > 0 && (
            <p className="mt-1 text-sm text-gray-400">{manga.altTitles.join(' · ')}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {manga.year && (
              <span className="rounded bg-dark-700 px-2 py-1">{manga.year}</span>
            )}
            {manga.status && (
              <span className="rounded bg-dark-700 px-2 py-1 capitalize">
                {manga.status === 'ongoing' ? 'Ongoing' : 'Selesai'}
              </span>
            )}
            {manga.originalLanguage && (
              <span className="rounded bg-dark-700 px-2 py-1 uppercase">
                {manga.originalLanguage}
              </span>
            )}
            {manga.authors?.length > 0 && (
              <span className="rounded bg-dark-700 px-2 py-1">
                ✍️ {manga.authors.join(', ')}
              </span>
            )}
          </div>

          {manga.genres?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {manga.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-dark-600 px-2.5 py-0.5 text-xs text-gray-300"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={toggleFavorit}
            className={`mt-4 ${
              isFavorit ? 'btn-ghost' : 'btn-primary'
            }`}
          >
            {isFavorit ? '★ Tersimpan di Favorit' : '☆ Tambah ke Favorit'}
          </button>

          {manga.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-300">
              {manga.description}
            </p>
          )}
        </div>
      </div>

      {/* Daftar Chapter */}
      <section>
        <h2 className="mb-4 text-xl font-bold">
          Daftar Chapter{' '}
          <span className="text-sm font-normal text-gray-400">
            ({chapters.length} chapter bahasa Indonesia)
          </span>
        </h2>

        {chapters.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            Belum ada chapter bahasa Indonesia untuk komik ini.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-dark-700">
            {[...chapters].reverse().map((c, idx) => (
              <Link
                key={c.id}
                to={`/komik/${id}/baca/${c.id}`}
                className={`flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-dark-700 ${
                  idx % 2 === 0 ? 'bg-dark-800' : 'bg-dark-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-accent">
                    Ch. {c.chapter || '?'}
                  </span>
                  {c.title && <span className="text-gray-300">{c.title}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-gray-500">
                  <span>{c.group}</span>
                  <span>{formatTanggal(c.publishAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
