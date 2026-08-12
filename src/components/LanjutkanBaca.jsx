import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatPosisi, progressPersen } from '../lib/format';

function formatSelisih(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60 * 60 * 1000) return 'Baru saja';
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} jam lalu`;
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

// Widget "Lanjutkan Baca" di halaman Beranda. Membaca riwayat dari
// localStorage dan menampilkan chapter terakhir yang belum selesai,
// dengan link yang mengarah ke halaman baca sesuai sumbernya.
export default function LanjutkanBaca() {
  const [riwayat] = useLocalStorage('webkomik_riwayat', []);

  if (!riwayat || riwayat.length === 0) return null;

  // Ambil item yang paling terakhir dibaca
  const r = [...riwayat].sort((a, b) => (b.at || 0) - (a.at || 0))[0];
  const href =
    r.source === 'komiku'
      ? `/komiku/${r.id}/baca/${r.chapterId}`
      : `/komik/${r.id}/baca/${r.chapterId}`;
  const posisi = formatPosisi(r);
  const pct = progressPersen(r);

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">📖 Lanjutkan Baca</h2>
        <Link to="/riwayat" className="text-sm text-gray-500 hover:text-accent dark:text-gray-400">
          Lihat semua →
        </Link>
      </div>
      <Link
        to={href}
        className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-accent dark:border-dark-700 dark:bg-dark-800"
      >
        <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-dark-700">
          {r.cover ? (
            <img src={r.cover} alt={r.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl">📕</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-800 group-hover:text-accent dark:text-gray-100">
            {r.title}
          </p>
          <p className="mt-1 text-sm text-accent">
            Lanjutkan — Ch. {r.chapter || '?'}
            {posisi && <span className="text-gray-500 dark:text-gray-400"> · {posisi}</span>}
          </p>
          {pct !== null && (
            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-100 dark:bg-dark-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
        <span className="hidden shrink-0 text-xs text-gray-500 sm:inline">
          {formatSelisih(r.at)}
        </span>
      </Link>
    </section>
  );
}

