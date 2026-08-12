import { Link, useLocation } from 'react-router-dom';

export default function MangaCard({ manga }) {
  const location = useLocation();
  // Simpan asal halaman (path + query) supaya halaman Detail bisa membuat
  // tombol "Kembali" yang mengarah balik dengan state (mis. kategori) terjaga.
  const from = `${location.pathname}${location.search}`;

  return (
    <Link
      to={`/komik/${manga.id}`}
      state={{ from }}
      className="card-hover group overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-dark-700">
        {manga.cover ? (
          <img
            src={manga.cover}
            alt={manga.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            📕
          </div>
        )}
        {manga.year && (
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-gray-200">
            {manga.year}
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
