export default function Loading({ label = 'Memuat...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-dark-600 border-t-accent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
