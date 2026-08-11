import { useEffect, useRef, useState } from 'react';
import { getKomikuByGenre, searchKomiku } from '../api/komiku';
import KomikuCard from '../components/KomikuCard';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';

// Daftar genre Komiku (endpoint /genre-all sedang kosong di API, jadi daftar
// ini di-hardcode dari menu genre situs komiku.org).
const GENRES = [
  { label: 'Action', slug: 'action' },
  { label: 'Adventure', slug: 'adventure' },
  { label: 'Comedy', slug: 'comedy' },
  { label: 'Drama', slug: 'drama' },
  { label: 'Fantasy', slug: 'fantasy' },
  { label: 'Harem', slug: 'harem' },
  { label: 'Horror', slug: 'horror' },
  { label: 'Josei', slug: 'josei' },
  { label: 'Martial Arts', slug: 'martial-arts' },
  { label: 'Mature', slug: 'mature' },
  { label: 'Mystery', slug: 'mystery' },
  { label: 'One Shot', slug: 'one-shot' },
  { label: 'Psychological', slug: 'psychological' },
  { label: 'Romance', slug: 'romance' },
  { label: 'School Life', slug: 'school-life' },
  { label: 'Sci-fi', slug: 'sci-fi' },
  { label: 'Seinen', slug: 'seinen' },
  { label: 'Shoujo', slug: 'shoujo' },
  { label: 'Shounen', slug: 'shounen' },
  { label: 'Slice of Life', slug: 'slice-of-life' },
  { label: 'Sports', slug: 'sports' },
  { label: 'Tragedy', slug: 'tragedy' },
  { label: 'Webtoon', slug: 'webtoon' },
];

export default function Komiku() {
  const [genre, setGenre] = useState('romance');
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState('genre'); // 'genre' | 'search'
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const searching = mode === 'search' && query.trim() !== '';

  // API genre hanya memberi hasNextPage (tanpa totalPages pasti), jadi total
  // halaman dihitung bertahap: halaman terakhir adalah halaman pertama yang
  // responsnya hasNextPage=false.
  const totalPages = searching ? 1 : hasNextPage ? page + 1 : page;

  // Muat daftar genre / hasil pencarian saat dependency berubah
  useEffect(() => {
    const reqId = ++requestIdRef.current;
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        if (searching) {
          const d = await searchKomiku(query);
          if (!active || reqId !== requestIdRef.current) return;
          setResults(d.results);
          setTotal(d.total);
          setHasNextPage(false);
        } else {
          const d = await getKomikuByGenre(genre, page);
          if (!active || reqId !== requestIdRef.current) return;
          setResults(d.results);
          setTotal(d.total);
          setHasNextPage(d.hasNextPage);
        }
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
  }, [genre, page, mode, query, searching]);

  // Scroll ke atas saat pindah halaman / ganti filter
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [genre, page, query, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setPage(1);
    setMode('search');
    setQuery(q);
  };

  const changeGenre = (value) => {
    if (value === genre && mode === 'genre') return;
    setMode('genre');
    setGenre(value);
    setPage(1);
  };

  const changePage = (next) => {
    if (next < 1 || next > totalPages || next === page) return;
    setPage(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Komiku</h1>
      <p className="mb-6 text-sm text-gray-400">
        Koleksi komik berbahasa Indonesia dari Komiku — lengkap dengan chapter terjemahan.
      </p>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cari judul di Komiku..."
          className="input-field"
        />
        <button type="submit" className="btn-primary shrink-0">
          Cari
        </button>
      </form>

      <div className="mb-6">
        <label className="mb-1 block text-sm text-gray-400">Jelajahi per genre:</label>
        <select
          value={mode === 'search' ? '' : genre}
          onChange={(e) => changeGenre(e.target.value)}
          className="input-field max-w-xs"
        >
          {mode === 'search' && <option value="">Hasil pencarian</option>}
          {GENRES.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loading label={searching ? 'Mencari di Komiku...' : `Memuat komik ${genre}...`} />
      ) : error ? (
        <p className="text-red-400">
          Gagal memuat: {error} — kemungkinan genre/endpoint sedang bermasalah di API Komiku.
        </p>
      ) : results.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          {searching
            ? 'Tidak ada komik yang cocok. Coba kata kunci lain.'
            : 'Tidak ada komik untuk genre ini.'}
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-400">
            {searching ? (
              <>
                Ditemukan {total} hasil untuk &quot;{query}&quot;
              </>
            ) : (
              <>
                Komik genre <span className="text-gray-200">{genre}</span> — halaman {page}
              </>
            )}
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((m) => (
              <KomikuCard key={m.id} manga={m} />
            ))}
          </div>

          {!searching && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <Pagination page={page} totalPages={totalPages} onChange={changePage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
