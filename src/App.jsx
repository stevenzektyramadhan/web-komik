import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Loading from './components/Loading';
import BackToTop from './components/BackToTop';
// Beranda dimuat eager (bukan lazy) supaya halaman awal langsung tampil.
import Beranda from './pages/Beranda';

const Kategori = lazy(() => import('./pages/Kategori'));
const Cari = lazy(() => import('./pages/Cari'));
const Detail = lazy(() => import('./pages/Detail'));
const Baca = lazy(() => import('./pages/Baca'));
const Favorit = lazy(() => import('./pages/Favorit'));
const Riwayat = lazy(() => import('./pages/Riwayat'));
const Komiku = lazy(() => import('./pages/Komiku'));
const KomikuDetail = lazy(() => import('./pages/KomikuDetail'));
const KomikuBaca = lazy(() => import('./pages/KomikuBaca'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Footer() {
  return (
    <footer className="mt-auto border-t border-dark-700 bg-dark-900 py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-xs leading-relaxed text-gray-500">
        <p>
          WebKomik — aplikasi gratis untuk membaca manga, manhwa, dan manhua dalam bahasa
          Indonesia.
        </p>
        <p className="mt-1">
          Seluruh data &amp; gambar bersumber dari{' '}
          <a
            href="https://mangadex.org"
            target="_blank"
            rel="noreferrer"
            className="text-gray-300 hover:text-accent"
          >
            MangaDex
          </a>
          . Hak cipta karya dimiliki oleh penulis &amp; grup scanlation masing-masing.
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<Loading label="Memuat halaman..." />}>
          <Routes>
            <Route path="/" element={<Beranda />} />
            <Route path="/kategori" element={<Kategori />} />
            <Route path="/cari" element={<Cari />} />
            <Route path="/komik/:id" element={<Detail />} />
            <Route path="/komik/:id/baca/:chapterId" element={<Baca />} />
            <Route path="/favorit" element={<Favorit />} />
            <Route path="/riwayat" element={<Riwayat />} />
            <Route path="/komiku" element={<Komiku />} />
            <Route path="/komiku/:slug" element={<KomikuDetail />} />
            <Route path="/komiku/:slug/baca/:chapter" element={<KomikuBaca />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <BackToTop />
      <Footer />
    </div>
  );
}

