import { useEffect } from 'react';

// Hook untuk mengubah judul & meta description per halaman (SEO / berbagi link).
// Dipanggil di setiap halaman dengan nilai dinamis (mis. judul komik di Detail).
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }, [title, description]);
}
