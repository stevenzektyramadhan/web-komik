import { useEffect, useRef, useState } from 'react';
import { searchManga } from '../api/mangadex';
import MangaCard from '../components/MangaCard';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';

const LIMIT = 100;

export default function Cari() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const searched = query.trim() !== '';

  // Muat hasil pencarian saat query atau halaman berubah
  useEffect(() => {
    if (!query.trim()) return;
    const reqId = ++requestIdRef.current;
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { results: r, total: t } = await searchManga(
          query,
          LIMIT,
          (page - 1) * LIMIT
        );
        if (!active || reqId !== requestIdRef.current) return;
        setResults(r);
        setTotal(t);
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
  }, [query, page]);

  // Scroll ke atas saat pindah halaman / ganti query
  useEffect(() => {
    if (query.trim()) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [query, page]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setPage(1);
    setQuery(q);
  };

  const changePage = (next) => {
    if (next < 1 || next > totalPages || next === page) return;
    setPage(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Cari Komik</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cari judul komik, manga, manhwa, manhua..."
          className="input-field"
        />
        <button type="submit" className="btn-primary shrink-0">
          Cari
        </button>
      </form>

      {loading && <Loading label="Mencari..." />}

      {!loading && error && <p className="text-red-400">Terjadi kesalahan: {error}</p>}

      {!loading && !error && searched && (
        <div>
          <p className="mb-4 text-sm text-gray-400">
            Ditemukan {total} hasil untuk &quot;{query}&quot;
          </p>
          {results.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              Tidak ada komik yang cocok. Coba kata kunci lain.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {results.map((m) => (
                  <MangaCard key={m.id} manga={m} />
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-500">
                  Menampilkan {results.length} dari {total} hasil
                </p>
                <Pagination page={page} totalPages={totalPages} onChange={changePage} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
