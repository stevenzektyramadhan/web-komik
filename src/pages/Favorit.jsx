import { Link } from 'react-router-dom';
import MangaCard from '../components/MangaCard';
import KomikuCard from '../components/KomikuCard';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Favorit() {
  const [favorit, setFavorit] = useLocalStorage('webkomik_favorit', []);

  // SEO: judul & deskripsi halaman Favorit
  usePageMeta(
    'Favorit Saya — WebKomik',
    'Daftar komik favorit yang kamu simpan di WebKomik.'
  );

  const hapus = (id) => {
    setFavorit(favorit.filter((f) => f.id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Favorit Saya</h1>

      {favorit.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-5xl">🔖</p>
          <p className="mt-4 text-gray-400">Belum ada komik favorit.</p>
          <Link to="/" className="btn-primary mt-4">
            Jelajahi Komik
          </Link>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {favorit.map((m) => (
              <div key={m.id} className="relative">
                {m.source === 'komiku' ? (
                  <KomikuCard manga={m} />
                ) : (
                  <MangaCard manga={m} />
                )}
                <button
                  onClick={() => hapus(m.id)}
                  className="absolute right-2 top-2 z-10 rounded-full bg-black/70 px-2 py-0.5 text-xs text-red-400 hover:bg-black"
                  title="Hapus dari favorit"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
