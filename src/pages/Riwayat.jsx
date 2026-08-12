import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePageMeta } from '../hooks/usePageMeta';

function formatWaktu(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60 * 60 * 1000) return 'Baru saja';
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} jam lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Label posisi baca terakhir: "Hlm. 3/20" (mode halaman) atau "50%" (scroll).
function formatPosisi(r) {
  if (typeof r.pageIdx === 'number' && r.totalPages) {
    return ` · Hlm. ${Math.min(r.pageIdx + 1, r.totalPages)}/${r.totalPages}`;
  }
  if (typeof r.progress === 'number') {
    return ` · ${Math.max(0, Math.min(99, r.progress))}%`;
  }
  return '';
}

export default function Riwayat() {
  const [riwayat, setRiwayat] = useLocalStorage('webkomik_riwayat', []);

  // SEO: judul & deskripsi halaman Riwayat
  usePageMeta(
    'Riwayat Baca — WebKomik',
    'Riwayat chapter yang pernah kamu baca di WebKomik.'
  );

  const hapusSemua = () => setRiwayat([]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Riwayat Baca</h1>
        {riwayat.length > 0 && (
          <button onClick={hapusSemua} className="text-sm text-gray-400 hover:text-red-400">
            Hapus semua
          </button>
        )}
      </div>

      {riwayat.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-5xl">📖</p>
          <p className="mt-4 text-gray-400">Belum ada riwayat baca.</p>
          <Link to="/" className="btn-primary mt-4">
            Mulai Baca
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {riwayat.map((r) => (
            <Link
              key={r.id + r.chapterId}
              to={
                r.source === 'komiku'
                  ? `/komiku/${r.id}/baca/${r.chapterId}`
                  : `/komik/${r.id}/baca/${r.chapterId}`
              }
              className="flex items-center gap-4 rounded-xl border border-dark-700 bg-dark-800 p-3 transition hover:border-accent"
            >
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-dark-700">
                {r.cover ? (
                  <img src={r.cover} alt={r.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">📕</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.title}</p>
                <p className="text-sm text-accent">
                  Lanjutkan — Ch. {r.chapter || '?'}
                  <span className="text-gray-400">{formatPosisi(r)}</span>
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-500">
                {formatWaktu(r.at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
