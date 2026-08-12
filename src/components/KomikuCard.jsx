import { Link, useLocation } from 'react-router-dom';

// Kartu komik khusus sumber Komiku — link ke /komiku/:slug (bukan /komik/:id
// milik MangaDex). Dipakai di halaman Komiku, Favorit, dan Riwayat.
export default function KomikuCard({ manga }) {
  const location = useLocation();
  // Simpan asal halaman supaya halaman Detail Komiku bisa membuat tombol
  // "Kembali" yang mengarah balik dengan state terjaga.
  const from = `${location.pathname}${location.search}`;
  const slug = manga.slug || manga.id;

  return (
    <Link
      to={`/komiku/${slug}`}
      state={{ from }}
      className="card-hover group overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800"
    >
      {/* NOTE: cover Komiku di list adalah banner horizontal (rasio ~1.91:1),
          bukan potret 3:4 seperti MangaDex. Memakai object-cover di kotak
          aspect-[3/4] membuat gambar tampak ngezoom/terpotong. Solusinya:
          tampilkan dengan rasio asli (h-auto w-full) — tidak ada crop/zoom. */}
      <div className="relative w-full overflow-hidden bg-gray-100 dark:bg-dark-700">
        {manga.cover ? (
          <img
            src={manga.cover}
            alt={manga.title}
            loading="lazy"
            className="h-auto w-full transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center text-4xl">
            📕
          </div>
        )}
        {manga.type && (
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-gray-200">
            {manga.type}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-800 group-hover:text-accent dark:text-gray-100">
          {manga.title}
        </h3>
      </div>
    </Link>
  );
}
