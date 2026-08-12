export default function Loading({ label = 'Memuat...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-accent dark:border-dark-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
