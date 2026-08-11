// Menghasilkan daftar nomor halaman dengan windowing (halaman aktif ±2,
// selalu sertakan halaman pertama & terakhir, sisanya diwakili "...").
function getPageNumbers(page, totalPages) {
  const pages = new Set([1, totalPages]);
  for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
    pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push('...');
    result.push(p);
    prev = p;
  }
  return result;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-dark-600 px-3 py-2 text-sm text-gray-300 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Halaman sebelumnya"
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-gray-500">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            disabled={p === page}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              p === page
                ? 'bg-accent text-white'
                : 'border border-dark-600 text-gray-300 hover:border-accent hover:text-accent'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-dark-600 px-3 py-2 text-sm text-gray-300 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Halaman berikutnya"
      >
        ›
      </button>
    </nav>
  );
}
