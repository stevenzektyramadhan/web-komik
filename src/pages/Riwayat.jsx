import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePageMeta } from '../hooks/usePageMeta';
import { formatPosisi, progressPersen } from '../lib/format';

function formatWaktu(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60 * 60 * 1000) return 'Baru saja';
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} jam lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Riwayat() {
  const [riwayat, setRiwayat] = useLocalStorage('webkomik_riwayat', []);

  // SEO: judul & deskripsi halaman Riwayat
  usePageMeta(
    'Riwayat Baca — WebKomik',
    'Riwayat chapter yang pernah kamu baca di WebKomik.'
  );

  const hapusSemua = () => setRiwayat([]);

  const hapusSatu = (id, chapterId) => {
    setRiwayat(riwayat.filter((r) => !(r.id === id && r.chapterId === chapterId)));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Riwayat Baca</h1>
        {riwayat.length > 0 && (
          <button onClick={hapusSemua} className="text-sm text-gray-500 hover:text-red-400 dark:text-gray-400">
            Hapus semua
          </button>
        )}
      </div>

      {riwayat.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-5xl">📖</p>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Belum ada riwayat baca.</p>
          <Link to="/" className="btn-primary mt-4">
            Mulai Baca
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {riwayat.map((r) => {
            const posisi = formatPosisi(r);
            const pct = progressPersen(r);
            return (
              <div
                key={r.id + r.chapterId}
                className="relative rounded-xl border border-gray-200 bg-white p-3 transition hover:border-accent dark:border-dark-700 dark:bg-dark-800"
              >
                <Link
                  to={
                    r.source === 'komiku'
                      ? `/komiku/${r.id}/baca/${r.chapterId}`
                      : `/komik/${r.id}/baca/${r.chapterId}`
                  }
                  className="flex items-center gap-4"
                >
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-dark-700">
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
                      {posisi ? <span className="text-gray-500 dark:text-gray-400"> · {posisi}</span> : null}
                    </p>
                    {pct !== null && (
                      <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-100 dark:bg-dark-700">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-500">{formatWaktu(r.at)}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => hapusSatu(r.id, r.chapterId)}
                  aria-label={`Hapus ${r.title} Ch. ${r.chapter || '?'} dari riwayat`}
                  title="Hapus dari riwayat"
                  className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500 transition hover:bg-red-600 hover:text-white dark:bg-dark-700 dark:text-gray-400"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
