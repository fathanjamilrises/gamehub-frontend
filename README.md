# GameHub.ID — Next.js Project

Proyek ini dibuat 1:1 sesuai desain Figma GameHub.ID.

## 📁 Struktur Folder

```
gamehub/
├── app/                    # Next.js App Router (halaman)
│   ├── layout.tsx          # Root layout (font, metadata)
│   ├── globals.css         # CSS global + Tailwind
│   ├── page.tsx            # Halaman Home (/)
│   └── topup/
│       ├── page.tsx        # Halaman daftar Top Up (/topup)
│       └── [slug]/
│           └── page.tsx    # Halaman detail game (/topup/mobile-legends, dll)
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx      # Navigasi atas (dengan tombol Masuk/Daftar)
│   │   └── Footer.tsx      # Footer dengan link & sosmed
│   └── ui/
│       ├── AuthModal.tsx   # Popup Login & Daftar (modal overlay)
│       └── GameCard.tsx    # Kartu game (thumbnail + info)
├── data/
│   └── games.ts            # Data dummy semua game & nominal
└── public/                 # Aset statis
```

## 🚀 Cara Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## 📄 Halaman yang Tersedia

| Route | Keterangan |
|-------|------------|
| `/` | Homepage dengan hero, service cards, game list, stats |
| `/topup` | Daftar semua game untuk top up |
| `/topup/mobile-legends` | Detail top up Mobile Legends |
| `/topup/free-fire` | Detail top up Free Fire |
| `/topup/pubg-mobile` | Detail top up PUBG Mobile |
| `/topup/genshin-impact` | Detail top up Genshin Impact |
| `/topup/valorant` | Detail top up Valorant |
| `/topup/honor-of-kings` | Detail top up Honor of Kings |

## 🎨 Fitur Desain

- ✅ Navbar sticky dengan tombol Masuk & Daftar
- ✅ Popup Login/Daftar (modal) dengan tab switcher
- ✅ Homepage: hero section, service cards, game grid (6 kolom), stats
- ✅ Halaman Top Up: search + grid game
- ✅ Detail game: banner, step 1 (User ID), step 2 (pilih nominal), sidebar ringkasan
- ✅ Footer dengan 4 kolom
- ✅ Data dummy lengkap (6 game, masing-masing 6-10 nominal)
- ✅ Warna & tema 1:1 dengan Figma (biru #2563EB, Inter font)
