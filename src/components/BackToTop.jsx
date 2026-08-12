import { useEffect, useState } from 'react';

// Tombol mengambang "kembali ke atas" — muncul setelah halaman di-scroll
// lebih dari 600px, klik untuk smooth scroll kembali ke posisi awal.
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Kembali ke atas"
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-lg text-gray-700 shadow-lg transition-all duration-200 hover:border-accent hover:text-accent dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      ↑
    </button>
  );
}
