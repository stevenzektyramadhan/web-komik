import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';

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

// Label posisi baca terakhir: "Hlm. 3/20" (mode halaman) atau "50%" (scroll).
function formatPosisi(r) {
  if (typeof r.pageIdx === 'number' && r.totalPages) {
    return `Hlm. ${Math.min(r.pageIdx + 1, r.totalPages)}/${r.totalPages}`;
  }
  if (typeof r.progress === 'number') {
    return `${Math.max(0, Math.min(99, r.progress))}%`;
  }
  return '';
}

// Widget "Lanjutkan Baca" di halaman Beranda. Membaca riwayat dari
// localStorage dan menampilkan chapter terakhir yang belum selesai,
// dengan link yang mengarah ke halaman baca sesuai sumbernya.
export default function LanjutkanBaca() {
  const [riwayat] = useLocalStorage('webkomik_riwayat', []);

  if (!riwayat || riwayat.length === 0) return null;

  const r = riwayat[0];
  const href =
    r.source === 'komiku'
      ? `/komiku/${r.id}/baca/${r.chapterId}`
      : `/komik/${r.id}/baca/${r.chapterId}`;
  const posisi = formatPosisi(r);

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">📖 Lanjutkan Baca</h2>
        <Link to="/riwayat" className="text-sm text-gray-400 hover:text-accent">
          Lihat semua →
        </Link>
      </div>
      <Link
        to={href}
        className="group flex items-center gap-4 rounded-xl border border-dark-700 bg-dark-800 p-4 transition hover:border-accent"
      >
        <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-dark-700">
          {r.cover ? (
            <img src={r.cover} alt={r.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl">📕</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-100 group-hover:text-accent">
            {r.title}
          </p>
          <p className="mt-1 text-sm text-accent">
            Lanjutkan — Ch. {r.chapter || '?'}
            {posisi && <span className="text-gray-400"> · {posisi}</span>}
          </p>
        </div>
        <span className="hidden shrink-0 text-xs text-gray-500 sm:inline">
          {formatSelisih(r.at)}
        </span>
      </Link>
    </section>
  );
}
