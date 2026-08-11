import { useEffect, useRef, useState } from 'react';
import { getByFormat, getGenres } from '../api/mangadex';
import MangaCard from '../components/MangaCard';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';

const FORMATS = [
  { key: 'manga', label: 'Manga' },
  { key: 'manhwa', label: 'Manhwa' },
  { key: 'manhua', label: 'Manhua' },
];

const LIMIT = 100;

export default function Kategori() {
  const [format, setFormat] = useState('manga');
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [page, setPage] = useState(1);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const requestIdRef = useRef(0);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Muat daftar genre sekali saat halaman dibuka
  useEffect(() => {
    let active = true;
    getGenres()
      .then((g) => {
        if (active) setGenres(g);
      })
      .catch(() => {
        // gagal memuat genre tidak memblokir halaman
      });
    return () => {
      active = false;
    };
  }, []);

  // Muat halaman saat format atau nomor halaman berubah
  useEffect(() => {
    const reqId = ++requestIdRef.current;
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { results, total: totalItems } = await getByFormat(
          format,
          LIMIT,
          (page - 1) * LIMIT,
          genre || null
        );
        if (!active || reqId !== requestIdRef.current) return;
        setList(results);
        setTotal(totalItems);
      } catch (e) {
        if (!active || reqId !== requestIdRef.current) return;
        setError(e.message);
      } finally {
        if (active && reqId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [format, genre, page]);

  // Scroll ke atas saat pindah halaman / ganti format
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [format, genre, page]);

  const changeFormat = (key) => {
    if (key === format) return;
    setPage(1);
    setFormat(key);
  };

  const changeGenre = (value) => {
    if (value === genre) return;
    setPage(1);
    setGenre(value);
  };

  const changePage = (next) => {
    if (next < 1 || next > totalPages || next === page) return;
    setPage(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Kategori</h1>

      <div className="mb-6 flex gap-2">
        {FORMATS.map((f) => (
          <button
            key={f.key}
            onClick={() => changeFormat(f.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              format === f.key
                ? 'bg-accent text-white'
                : 'border border-dark-600 text-gray-300 hover:border-accent hover:text-accent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <select
          value={genre}
          onChange={(e) => changeGenre(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="">Semua Genre</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loading label={`Memuat komik ${format}...`} />
      ) : error ? (
        <p className="text-red-400">Gagal memuat: {error}</p>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-gray-500">Tidak ada komik untuk kategori ini.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {list.map((m) => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500">
              Menampilkan {list.length} komik dari total {total}
            </p>
            <Pagination page={page} totalPages={totalPages} onChange={changePage} />
          </div>
        </>
      )}
    </div>
  );
}
