import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getKomikuByGenre, searchKomiku } from '../api/komiku';
import KomikuCard from '../components/KomikuCard';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import { usePageMeta } from '../hooks/usePageMeta';

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

// Filter tipe komik (Manga / Manhwa / Manhua). Nilai `tipe` di URL query
// string. '' berarti semua tipe. API Komiku menaruh field `type` di tiap
// item daftar, jadi pemfilteran dilakukan di klien setelah data dimuat.
const TYPES = [
  { label: 'Semua', value: '' },
  { label: 'Manga', value: 'manga' },
  { label: 'Manhwa', value: 'manhwa' },
  { label: 'Manhua', value: 'manhua' },
];

export default function Komiku() {
  // Filter (genre/mode/halaman/kata kunci) disimpan di URL query string
  // supaya tetap terjaga saat kembali dari halaman Detail Komiku / memakai
  // tombol back browser (pola sama seperti halaman Kategori).
  const [searchParams, setSearchParams] = useSearchParams();
  const genre = searchParams.get('genre') || 'romance';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const mode = searchParams.get('mode') === 'search' ? 'search' : 'genre'; // 'genre' | 'search'
  const query = searchParams.get('q') || '';
  // Filter tipe (Manga / Manhwa / Manhua). API Komiku tidak mendukung filter
  // tipe server-side per genre, jadi hasil yang dimuat per genre/pencarian
  // difilter di klien berdasarkan field `type` tiap item.
  const typeFilter = searchParams.get('tipe') || ''; // '' | 'manga' | 'manhwa' | 'manhua'

  const [input, setInput] = useState(query);
  const [results, setResults] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const searching = mode === 'search' && query.trim() !== '';

  // Hasil yang sudah dimuat API (per genre / pencarian) difilter berdasarkan
  // tipe yang dipilih. Pencocokan tidak peka huruf besar/kecil.
  const filteredResults = typeFilter
    ? results.filter(
        (m) => (m.type || '').toLowerCase() === typeFilter.toLowerCase()
      )
    : results;

  // SEO: judul & deskripsi mengikuti mode (genre / pencarian) + filter tipe
  const typeLabel = TYPES.find((t) => t.value === typeFilter)?.label || '';
  usePageMeta(
    searching
      ? `Cari "${query.trim()}" di Komiku${typeLabel ? ` — ${typeLabel}` : ''} — WebKomik`
      : `Komiku — Genre ${genre}${typeLabel ? ` — ${typeLabel}` : ''} — WebKomik`,
    'Koleksi komik berbahasa Indonesia dari Komiku — lengkap dengan chapter terjemahan.'
  );

  // Jaga kotak pencarian tetap sinkron dengan query di URL (mis. saat
  // kembali dari halaman Detail / back browser ke mode genre).
  useEffect(() => {
    setInput(query);
  }, [query]);

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
          setHasNextPage(false);
        } else {
          const d = await getKomikuByGenre(genre, page);
          if (!active || reqId !== requestIdRef.current) return;
          setResults(d.results);
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

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams);
    // Set nilai yang berubah; hapus key jika kosong agar URL tetap bersih
    Object.entries(next).forEach(([key, value]) => {
      if (value === '' || value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    updateParams({ q, mode: 'search', page: 1 });
  };

  const changeGenre = (value) => {
    if (value === genre && mode === 'genre') return;
    // tipe dibiarkan (dipertahankan di URL) saat ganti genre.
    updateParams({ genre: value, mode: 'genre', page: 1, q: '' });
  };

  const changeType = (value) => {
    updateParams({ tipe: value, page: 1 });
  };

  const changePage = (next) => {
    if (next < 1 || next > totalPages || next === page) return;
    updateParams({ page: next });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Komiku</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
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

      {/* Filter tipe: Manga / Manhwa / Manhua / Semua */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t.value || 'all'}
            type="button"
            onClick={() => changeType(t.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              typeFilter === t.value
                ? 'bg-accent text-white'
                : 'border border-gray-300 text-gray-600 hover:border-accent hover:text-accent dark:border-dark-600 dark:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">Jelajahi per genre:</label>
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
      ) : filteredResults.length === 0 ? (
        <p className="py-10 text-center text-gray-500 dark:text-gray-400">
          {searching
            ? 'Tidak ada komik yang cocok. Coba kata kunci lain.'
            : typeFilter
              ? `Tidak ada komik tipe ${typeLabel} untuk genre ${genre}.`
              : 'Tidak ada komik untuk genre ini.'}
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {searching ? (
              <>
                Ditemukan {filteredResults.length} hasil untuk &quot;{query}&quot;
                {typeLabel ? ` (tipe ${typeLabel})` : ''}
              </>
            ) : (
              <>
                Komik genre <span className="text-gray-700 dark:text-gray-200">{genre}</span>
                {typeLabel ? (
                  <>
                    {' '}— tipe <span className="text-gray-700 dark:text-gray-200">{typeLabel}</span>
                  </>
                ) : null}
                {' '}— halaman {page}
              </>
            )}
          </p>

          {/* Grid lebih lebar (4 kolom max) karena cover Komiku berbentuk
              banner horizontal (~1.91:1), bukan potret 3:4 seperti MangaDex. */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredResults.map((m) => (
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
