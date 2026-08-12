import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getByFormat, getGenres } from '../api/mangadex';
import MangaCard from '../components/MangaCard';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import { usePageMeta } from '../hooks/usePageMeta';

const FORMATS = [
  { key: 'manga', label: 'Manga' },
  { key: 'manhwa', label: 'Manhwa' },
  { key: 'manhua', label: 'Manhua' },
];

const LIMIT = 100;

export default function Kategori() {
  // Filter (format/genre/halaman) disimpan di URL query string supaya tetap
  // terjaga saat kembali dari halaman Detail / memakai tombol back browser.
  const [searchParams, setSearchParams] = useSearchParams();
  const format = searchParams.get('format') || 'manga';
  const genre = searchParams.get('genre') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [genres, setGenres] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const requestIdRef = useRef(0);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // SEO: judul & deskripsi mengikuti format yang sedang dipilih
  const formatLabel = FORMATS.find((f) => f.key === format)?.label || format;
  usePageMeta(
    `Kategori ${formatLabel} — WebKomik`,
    `Jelajahi komik ${formatLabel} bahasa Indonesia di WebKomik.`
  );

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

  // Muat halaman saat format, genre, atau nomor halaman berubah
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

  // Scroll ke atas saat pindah halaman / ganti filter
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [format, genre, page]);

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

  const changeFormat = (key) => {
    if (key === format) return;
    updateParams({ format: key, page: 1 });
  };

  const changeGenre = (value) => {
    if (value === genre) return;
    updateParams({ genre: value, page: 1 });
  };

  const changePage = (next) => {
    if (next < 1 || next > totalPages || next === page) return;
    updateParams({ page: next });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Kategori</h1>

      <div className="mb-6 flex flex-wrap gap-2">
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
