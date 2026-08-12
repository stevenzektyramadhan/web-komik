# 📖 WebKomik — Baca Komik Bahasa Indonesia Gratis

Aplikasi web gratis (Rp 0) untuk membaca **manga, manhwa, dan manhua** dalam bahasa
Indonesia, dibangun dengan React + Vite + Tailwind CSS dan bersumber dari
**[MangaDex API](https://api.mangadex.org)** serta **Komiku**.

## ✨ Fitur

- 🏠 **Beranda** — komik terbaru (chapter bahasa Indonesia terakhir diunggah) & populer
- 🗂 **Kategori** — tab Manga / Manhwa / Manhua (tag diambil dari MangaDex saat runtime)
- 🔍 **Cari** — pencarian judul (MangaDex & Komiku)
- 📖 **Detail** — sinopsis, genre, penulis, daftar chapter bahasa Indonesia
- 📚 **Pembaca** — mode **scroll vertikal** & mode **halaman**, navigasi prev/next chapter,
  **auto-load chapter berikutnya** saat mendekati bawah halaman (mode scroll)
- ⭐ **Favorit** — simpan komik (localStorage)
- 🕘 **Riwayat** — lanjutkan baca dari chapter terakhir, **hapus per-item**, **progress bar**
- ⚡ **Cache API** — daftar & detail disimpan di localStorage (10 menit / 1 jam) supaya
  navigasi kembali instan dan tetap terbaca saat offline
- 🌓 **Mode terang & gelap** penuh (`dark:` variants, tersimpan di localStorage), UI 100% Bahasa Indonesia

## 🧪 Test

Unit test memakai **Vitest + Testing Library** (helper murni: cache, tema, format, hook localStorage):

```bash
npm test          # sekali jalan
npm run test:watch # watch mode
```

## 🚀 Menjalankan

```bash
npm install
npm run dev        # development — buka http://localhost:5173
npm run build      # production build → folder dist/
npm run preview    # preview build
```

## 🧱 Struktur

```
src/
├── api/                     # API layer MangaDex (mangadex.js) & Komiku (komiku.js)
├── components/              # Navbar, MangaCard, KomikuCard, Loading, Pagination, ...
├── hooks/                   # useLocalStorage (favorit & riwayat), usePageMeta
├── lib/                     # cache (localStorage+TTL), theme (mode terang/gelap), format
├── pages/                   # Beranda, Kategori, Cari, Detail, Baca, Favorit, Riwayat, Komiku, ...
└── App.jsx                  # routing + footer
```

## ⚖️ Legal (kewajiban MangaDex)

- Semua data & gambar bersumber dari MangaDex (dan sebagian dari Komiku).
- Kredit diberikan ke MangaDex dan grup scanlation (tercantum di footer & daftar chapter).
- Aplikasi **tanpa iklan & tanpa fitur berbayar** — murni gratis.

