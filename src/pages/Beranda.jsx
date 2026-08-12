import { useEffect, useState } from 'react';
import { getLatest, getPopular } from '../api/mangadex';
import MangaCard from '../components/MangaCard';
import Loading from '../components/Loading';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Beranda() {
  const [latest, setLatest] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // SEO: judul & deskripsi halaman Beranda
  usePageMeta(
    'WebKomik — Baca Komik Bahasa Indonesia',
    'Baca manga, manhwa, dan manhua bahasa Indonesia secara gratis.'
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [l, p] = await Promise.all([getLatest(18), getPopular(18)]);
        if (!active) return;
        setLatest(l.results);
        setPopular(p.results);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loading label="Memuat komik terbaru..." />;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg text-red-400">Gagal memuat data: {error}</p>
        <p className="mt-2 text-sm text-gray-400">
          Periksa koneksi internet Anda. MangaDex API mungkin sedang tidak dapat diakses.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <section className="mb-10 rounded-2xl border border-dark-700 bg-gradient-to-r from-dark-800 to-dark-900 p-6 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Baca Komik <span className="text-accent">Bahasa Indonesia</span> Gratis
        </h1>
        <p className="mt-2 max-w-2xl text-gray-400">
          Ribuan manga, manhwa, dan manhua dengan terjemahan bahasa Indonesia.
          Sumber data: MangaDex API.
        </p>
      </section>

      {/* Terbaru */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">🔥 Terbaru</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {latest.map((m) => (
            <MangaCard key={m.id} manga={m} />
          ))}
        </div>
      </section>

      {/* Populer */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">⭐ Populer</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {popular.map((m) => (
            <MangaCard key={m.id} manga={m} />
          ))}
        </div>
      </section>
    </div>
  );
}
