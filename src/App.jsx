import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Beranda from './pages/Beranda';
import Kategori from './pages/Kategori';
import Cari from './pages/Cari';
import Detail from './pages/Detail';
import Baca from './pages/Baca';
import Favorit from './pages/Favorit';
import Riwayat from './pages/Riwayat';

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
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/kategori" element={<Kategori />} />
          <Route path="/cari" element={<Cari />} />
          <Route path="/komik/:id" element={<Detail />} />
          <Route path="/komik/:id/baca/:chapterId" element={<Baca />} />
          <Route path="/favorit" element={<Favorit />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="*" element={<Beranda />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

