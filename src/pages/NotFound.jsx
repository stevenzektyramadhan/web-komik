import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta(
    '404 — Halaman Tidak Ditemukan | WebKomik',
    'Halaman yang kamu cari tidak ditemukan. Kembali ke beranda WebKomik.'
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center">
      <p className="text-7xl">🕵️</p>
      <h1 className="mt-4 text-3xl font-bold">404 — Halaman Tidak Ditemukan</h1>
      <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
        Halaman yang kamu cari mungkin sudah dipindah, dihapus, atau memang tidak pernah ada.
      </p>
      <Link to="/" className="btn-primary mt-6">
        ← Kembali ke Beranda
      </Link>
    </div>
  );
}
