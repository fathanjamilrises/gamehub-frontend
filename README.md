# GameHub — Game Top-Up & Account Marketplace

Platform jual-beli akun game dan top-up voucher game berbasis web. Dibangun dengan **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4**, dan terintegrasi dengan backend REST API + **Xendit** payment gateway.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16.2.4 (Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript 5 |
| Realtime | Socket.IO Client |
| Payment | Xendit (via backend) |
| State | React Hooks + Context |

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (atau yarn / pnpm)
- **Backend API** harus sudah berjalan (lihat bagian Environment Variables)

---

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/fathanjamilrises/gamehub-frontend.git
cd gamehub-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Salin file `.env.example` menjadi `.env.local`, lalu sesuaikan:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Backend API URL (wajib)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Catatan:** Ganti `localhost:8000` dengan IP/port backend kamu. Jika backend di jaringan lokal lain, gunakan IP LAN (misal `http://192.168.1.6:3000`).

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 5. Build untuk Production

```bash
npm run build
npm start
```

---

## Project Structure

```
gamehub-frontend/
├── app/                          # Next.js App Router (pages)
│   ├── layout.tsx                # Root layout (font, metadata, providers)
│   ├── globals.css               # Global CSS + Tailwind
│   ├── page.tsx                  # Homepage (/)
│   ├── topup/                    # Top-up game
│   │   ├── page.tsx              # Daftar game (/topup)
│   │   └── [slug]/              # Detail game (/topup/mobile-legends)
│   │       ├── page.tsx
│   │       └── TopUpClient.tsx
│   ├── vouchers/                 # Voucher game
│   │   ├── page.tsx              # Daftar voucher (/vouchers)
│   │   └── [slug]/page.tsx       # Detail voucher
│   ├── accounts/                 # Marketplace akun game
│   │   └── [slug]/page.tsx       # Detail listing akun
│   ├── orders/                   # Pesanan user
│   │   ├── page.tsx              # Daftar pesanan top-up (/orders)
│   │   └── akun/page.tsx         # Daftar pesanan beli akun (/orders/akun)
│   ├── my-orders/                # Order detail & redirect
│   │   ├── page.tsx              # Redirect ke /orders
│   │   └── [id]/page.tsx         # Detail pesanan akun (/my-orders/:id)
│   ├── checkout/
│   │   └── akun/[slug]/page.tsx  # Checkout beli akun
│   ├── payment/
│   │   └── success/
│   │       └── akun/page.tsx     # Nota pembayaran akun
│   ├── reseller/                 # Dashboard reseller
│   │   ├── page.tsx              # Dashboard utama + registrasi
│   │   ├── jual-akun/page.tsx    # Form posting akun baru
│   │   ├── orders/               # Pesanan masuk reseller
│   │   │   ├── page.tsx          # Daftar pesanan masuk
│   │   │   └── [id]/page.tsx     # Detail + kirim data akun
│   │   └── postings/page.tsx     # Kelola postingan
│   ├── chat/                     # Fitur chat
│   │   ├── page.tsx              # Daftar room chat
│   │   └── [roomId]/page.tsx     # Room chat detail
│   ├── admin/                    # Panel admin
│   │   ├── page.tsx              # Dashboard admin
│   │   ├── games/page.tsx        # Kelola game
│   │   ├── orders/page.tsx       # Kelola pesanan top-up
│   │   ├── akun-orders/page.tsx  # Kelola pesanan akun
│   │   ├── resellers/page.tsx    # Kelola reseller
│   │   ├── users/page.tsx        # Kelola user
│   │   ├── vouchers/page.tsx     # Kelola voucher
│   │   └── vip-orders/page.tsx   # Kelola VIP orders
│   ├── profile/page.tsx          # Profil user
│   └── api/
│       └── payment/success/route.ts  # API route: Xendit redirect handler
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            # Navigasi utama
│   │   └── Footer.tsx            # Footer
│   ├── ui/                       # Komponen UI reusable
│   │   ├── AuthModal.tsx         # Modal login/daftar
│   │   ├── GameCard.tsx          # Kartu game
│   │   ├── BannerSlider.tsx      # Slider banner
│   │   ├── CartDrawer.tsx        # Drawer keranjang
│   │   └── ...
│   ├── admin/
│   │   └── AdminShell.tsx        # Layout admin panel
│   └── providers/
│       └── Providers.tsx         # Context providers wrapper
│
├── lib/                          # Utilities & API layer
│   ├── authApi.ts                # Auth API (login, register, token)
│   ├── gamesApi.ts               # Games & vouchers API
│   ├── orderAkunApi.ts           # Order akun API (buyer, seller, admin)
│   ├── cartApi.ts                # Cart API
│   ├── chatApi.ts                # Chat REST API
│   ├── chatSocket.ts             # Socket.IO client
│   ├── adminFetch.ts             # Admin-authenticated fetch
│   ├── api.ts                    # Generic API helpers
│   ├── paymentReceipt.ts         # Format receipt data
│   ├── types.ts                  # Shared TypeScript types
│   ├── mockData.ts               # Mock/fallback data
│   ├── hooks/
│   │   └── useAuth.tsx           # Auth hook (login state, user data)
│   ├── contexts/
│   │   ├── ToastContext.tsx       # Toast notification context
│   │   └── CartContext.tsx        # Cart state context
│   └── dummy/                    # Dummy data untuk development
│
├── public/                       # Static assets (images, icons)
├── .env.example                  # Template environment variables
├── .gitignore
├── next.config.ts                # Next.js config (rewrites, images)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Halaman & Route

### Public Pages

| Route | Deskripsi |
|-------|-----------|
| `/` | Homepage — banner, game grid, stats, how-it-works |
| `/topup` | Daftar game top-up |
| `/topup/[slug]` | Detail game + pilih nominal + bayar |
| `/vouchers` | Daftar voucher game |
| `/vouchers/[slug]` | Detail voucher |
| `/accounts/[slug]` | Detail listing akun game |
| `/profile` | Profil & pengaturan user |

### Order & Payment

| Route | Deskripsi |
|-------|-----------|
| `/orders` | Pesanan saya — tab Top Up / Voucher |
| `/orders/akun` | Pesanan saya — tab Beli Akun |
| `/my-orders/[id]` | Detail pesanan akun (buyer view) |
| `/checkout/akun/[slug]` | Halaman checkout beli akun |
| `/payment/success/akun` | Nota pembayaran akun (setelah bayar via Xendit) |

### Reseller Dashboard

| Route | Deskripsi |
|-------|-----------|
| `/reseller` | Dashboard reseller (registrasi / overview / postingan / withdraw) |
| `/reseller/jual-akun` | Form posting akun baru |
| `/reseller/orders` | Daftar pesanan masuk (seller view) |
| `/reseller/orders/[id]` | Detail pesanan + kirim data akun ke pembeli |
| `/reseller/postings` | Kelola postingan akun |

### Chat

| Route | Deskripsi |
|-------|-----------|
| `/chat` | Daftar room chat |
| `/chat/[roomId]` | Room chat detail (buyer ↔ seller) |

### Admin Panel

| Route | Deskripsi |
|-------|-----------|
| `/admin` | Dashboard admin |
| `/admin/games` | CRUD game |
| `/admin/orders` | Kelola pesanan top-up |
| `/admin/akun-orders` | Kelola pesanan akun (resolve dispute, dll) |
| `/admin/resellers` | Approve/reject reseller |
| `/admin/users` | Kelola user |
| `/admin/vouchers` | Kelola voucher |
| `/admin/vip-orders` | Kelola VIP orders |

---

## API Proxy

Frontend menggunakan **Next.js rewrites** untuk proxy request ke backend. Konfigurasi ada di `next.config.ts`:

```
/api-proxy/:path* → {NEXT_PUBLIC_API_URL}/api/:path*
```

Semua API call dari client-side menggunakan `/api-proxy/...` agar tidak terkena CORS issues.

### Contoh endpoint yang digunakan:

| Frontend Path | Backend Path | Deskripsi |
|---------------|--------------|-----------|
| `/api-proxy/auth/login` | `/api/auth/login` | Login |
| `/api-proxy/auth/register` | `/api/auth/register` | Register |
| `/api-proxy/games` | `/api/games` | List games |
| `/api-proxy/jual-beli-akun` | `/api/jual-beli-akun` | Listing akun |
| `/api-proxy/akun-orders/checkout` | `/api/akun-orders/checkout` | Checkout akun |
| `/api-proxy/akun-orders/seller/my-orders` | `/api/akun-orders/seller/my-orders` | Pesanan masuk seller |
| `/api-proxy/resellers/me` | `/api/resellers/me` | Data reseller sendiri |
| `/api-proxy/admin/resellers` | `/api/admin/resellers` | Admin: list reseller |

---

## Order Flow (Beli Akun)

```
1. Pembeli browse listing → /accounts/[slug]
2. Pembeli checkout → /checkout/akun/[slug]
3. Xendit payment link dibuat oleh backend
4. Pembeli bayar → Xendit redirect ke /api/payment/success
5. Frontend redirect ke /payment/success/akun (nota)
6. Webhook Xendit update status order di backend (paid)
7. Penjual lihat pesanan masuk → /reseller/orders
8. Penjual kirim data akun → /reseller/orders/[id] (deliver)
9. Pembeli cek data akun → /my-orders/[id]
10. Pembeli konfirmasi OK → status confirmed → saldo penjual bertambah
11. Pembeli dispute → admin review → refund atau release
```

---

## Reseller Dashboard Features

- **Overview**: Saldo (dari completed orders), total terjual, postingan aktif, tingkat reseller (Bronze/Silver/Gold/Sultan)
- **Akun Saya**: Kelola postingan (edit, hapus, bump, toggle status)
- **Penarikan**: Form tarik saldo ke bank/e-wallet
- **Pesanan Masuk**: List pesanan yang masuk, kirim data akun ke pembeli
- **Jual Akun**: Form posting akun baru dengan screenshot upload
- **Demo Mode**: Mode simulasi tanpa login (localStorage-based)

---

## Scripts

```bash
npm run dev       # Development server (Turbopack)
npm run build     # Production build
npm start         # Start production server
npm run lint      # ESLint check
```

---

## Branch Convention

| Branch | Deskripsi |
|--------|-----------|
| `main` | Branch utama / production-ready |
| `fathan` | Feature branch development |

---

## Troubleshooting

### Backend tidak terhubung

Pastikan:
1. Backend API sudah berjalan di URL yang di-set di `.env.local`
2. `NEXT_PUBLIC_API_URL` menggunakan URL yang bisa diakses dari browser (bukan `localhost` jika backend di mesin lain)
3. Restart dev server setelah mengubah `.env.local`

### CORS Error

Frontend sudah menggunakan proxy via `next.config.ts`. Jika masih error, pastikan backend mengizinkan request dari origin frontend.

### Build Error: useSearchParams

Jika muncul error tentang `useSearchParams()` tanpa Suspense boundary, pastikan halaman yang menggunakan `useSearchParams()` di-wrap dengan `<Suspense>`.

---

## Tim Pengembang

GameHub Team — Astakira Project

---

## License

Private — Internal use only.
