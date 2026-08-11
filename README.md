# 📖 WebKomik — Baca Komik Bahasa Indonesia Gratis

Aplikasi web gratis (Rp 0) untuk membaca **manga, manhwa, dan manhua** dalam bahasa
Indonesia, dibangun dengan React + Vite + Tailwind CSS dan bersumber dari
**[MangaDex API](https://api.mangadex.org)**.

## ✨ Fitur

- 🏠 **Beranda** — komik terbaru (chapter bahasa Indonesia terakhir diunggah) & populer
- 🗂 **Kategori** — tab Manga / Manhwa / Manhua (tag diambil dari MangaDex saat runtime)
- 🔍 **Cari** — pencarian judul
- 📖 **Detail** — sinopsis, genre, penulis, daftar chapter bahasa Indonesia
- 📚 **Pembaca** — mode **scroll vertikal** & mode **halaman**, navigasi prev/next chapter
- ⭐ **Favorit** — simpan komik (localStorage)
- 🕘 **Riwayat** — lanjutkan baca dari chapter terakhir (localStorage)
- 🌙 **Mode gelap** penuh, UI 100% Bahasa Indonesia

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
├── api/mangadex.js          # API layer MangaDex (filter bahasa id)
├── components/              # Navbar, MangaCard, Loading
├── hooks/useLocalStorage.js # hook favorit & riwayat
├── pages/                   # Beranda, Kategori, Cari, Detail, Baca, Favorit, Riwayat
└── App.jsx                  # routing + footer
```

## ⚖️ Legal (kewajiban MangaDex)

- Semua data & gambar bersumber dari MangaDex.
- Kredit diberikan ke MangaDex dan grup scanlation (tercantum di footer & daftar chapter).
- Aplikasi **tanpa iklan & tanpa fitur berbayar** — murni gratis.

