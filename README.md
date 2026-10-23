# Difabel Jabar Connect — Frontend

Aplikasi web (SPA) **Difabel Jabar Connect**: marketplace jasa inklusif + Sistem Informasi Geografis yang menghubungkan alumni difabel UPTD PPSGHD Jawa Barat dengan masyarakat pengguna jasa.

Repositori ini berisi **fondasi awal** frontend (React 18 + Vite). Fitur produk (auth, pencarian, peta, booking, ulasan) dibangun di issue berikutnya.

| Item          | Nilai                                       |
| ------------- | ------------------------------------------- |
| Stack         | React 18, Vite 6, React Router 7            |
| Kualitas kode | ESLint 9 (+ `jsx-a11y` strict), Prettier 3  |
| Testing       | Vitest 3, Testing Library, jsdom            |
| Deploy target | Vercel Hobby                                |
| Backend       | Express REST API di Railway (repo terpisah) |

---

## 1. Prasyarat

- **Node.js 20.19+** (disarankan 22 — lihat `.nvmrc`; jika memakai nvm: `nvm use`)
- **npm 10+**
- Backend Express berjalan lokal di `http://localhost:5000` (opsional — tanpa backend, halaman tetap jalan dan panel status API menampilkan pesan error)

## 2. Instalasi & Menjalankan

```bash
# 1. Clone dan masuk ke folder
git clone <URL_REPO_FRONTEND>
cd <nama-folder-repo>

# 2. Pasang dependensi
npm install

# 3. Siapkan environment lokal
cp .env.example .env.local        # Windows (PowerShell): Copy-Item .env.example .env.local

# 4. Jalankan development server
npm run dev
```

Buka `http://localhost:5173`. Beranda menampilkan panel **Status koneksi API** yang memanggil `GET {VITE_API_BASE_URL}/health`.

## 3. Perintah yang Tersedia

| Perintah               | Fungsi                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Development server di port 5173                                  |
| `npm run build`        | Build produksi ke folder `dist/`                                 |
| `npm run preview`      | Menjalankan hasil build secara lokal (port 4173)                 |
| `npm run lint`         | Cek ESLint (termasuk aturan aksesibilitas)                       |
| `npm run lint:fix`     | Perbaiki otomatis masalah lint yang bisa diperbaiki              |
| `npm run format`       | Format seluruh kode dengan Prettier                              |
| `npm run format:check` | Cek format tanpa mengubah file                                   |
| `npm test`             | Jalankan seluruh test sekali (Vitest)                            |
| `npm run test:watch`   | Test dalam mode watch                                            |
| `npm run check`        | Lint + format check + test + build (jalankan sebelum membuat PR) |

## 4. Environment Variable

Didefinisikan di `.env.example`. File `.env`/`.env.local` **tidak di-commit** (sudah di `.gitignore`).

| Variabel            | Wajib | Contoh                         | Keterangan                                       |
| ------------------- | ----- | ------------------------------ | ------------------------------------------------ |
| `VITE_API_BASE_URL` | Ya    | `http://localhost:5000/api/v1` | Base URL REST API backend, termasuk prefix versi |
| `VITE_APP_NAME`     | Tidak | `Difabel Jabar Connect`        | Nama aplikasi di UI dan judul tab                |

Aturan:

- **URL backend tidak boleh ditulis langsung di source code.** Semua akses lewat `getApiBaseUrl()` di `src/config/env.js`.
- Variabel `VITE_*` ikut terbundel ke browser → **jangan** menaruh secret/kredensial apa pun.
- Di Vercel, isi variabel yang sama di _Project Settings → Environment Variables_.

## 5. Struktur Direktori

```text
.
├── .github/workflows/ci.yml   # CI: lint, format, test, build
├── public/                    # Aset statis (favicon, dll.)
├── src/
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # Komposisi provider global + router
│   ├── config/env.js          # Pembacaan env terpusat
│   ├── lib/api/               # HTTP client (fetch + cookie) & fungsi endpoint
│   ├── routes/                # paths.js (konstanta path), routes.jsx, AppRouter.jsx
│   ├── layouts/               # RootLayout (skip link, header, main, footer)
│   ├── pages/                 # Satu folder per area halaman
│   │   ├── auth/              #   Login, Register
│   │   ├── services/          #   Pencarian layanan
│   │   ├── map/               #   Peta SIG (Leaflet)
│   │   ├── providers/         #   Detail profil provider
│   │   ├── customer/          #   Pesanan customer
│   │   ├── provider/          #   Dasbor provider
│   │   └── admin/             #   Dasbor admin
│   ├── features/              # Logika per domain (auth, search, map, booking, ...) — diisi sprint berikutnya
│   ├── components/
│   │   ├── ui/                # Komponen UI reusable hasil handoff UI/UX (Button, Input, Modal, ...)
│   │   ├── common/            # Komponen lintas halaman (SkipLink, PlaceholderPage, ApiStatus)
│   │   └── layout/            # Header, Footer
│   ├── hooks/                 # Custom hooks (useDocumentTitle, ...)
│   ├── context/               # React Context (AuthContext — SP1-04)
│   ├── styles/                # tokens.css (design tokens) & global.css
│   ├── assets/                # Gambar/ikon yang di-import dari kode
│   └── test/                  # Setup & helper testing
├── .env.example
├── eslint.config.js
├── vite.config.js
└── vercel.json                # Rewrite SPA agar refresh di sub-rute tidak 404
```

Alias import: `@/` → `src/` (contoh: `import { api } from '@/lib/api/client'`).

## 6. Rute Dasar

Semua rute di bawah ini masih **halaman placeholder** dan siap diganti setelah handoff UI/UX.

| Path                  | Halaman                      | Referensi              |
| --------------------- | ---------------------------- | ---------------------- |
| `/`                   | Beranda + status koneksi API | SP1-01                 |
| `/services`           | Cari layanan                 | FR-CUST-02             |
| `/map`                | Peta penyedia                | FR-CUST-03, FR-CUST-04 |
| `/provider/:id`       | Profil penyedia              | FR-CUST-05             |
| `/login`, `/register` | Autentikasi                  | SP1-04                 |
| `/bookings`           | Pesanan customer             | FR-CUST-08             |
| `/dashboard/provider` | Dasbor provider              | FR-PROV-*              |
| `/admin`              | Dasbor admin                 | FR-ADM-*               |
| `*`                   | 404                          | —                      |

Proteksi rute berdasarkan peran (customer/provider/admin) ditambahkan di **SP1-04** setelah Auth API (SP1-03) siap.

## 7. Konvensi Penting

**Keamanan (batasan klien dari dokumen arsitektur):**

- Tidak menyimpan secret DB atau JWT di frontend. Sesi memakai **HttpOnly cookie** → `apiRequest` selalu memakai `credentials: 'include'`. **Jangan** simpan token di `localStorage`.
- Frontend tidak membuat keputusan otorisasi final; semua dicek ulang oleh backend.
- Frontend hanya menerima `public_lat`/`public_lng` (koordinat kasar ~1 km), tidak pernah koordinat presisi provider.

**Kontrak API:**

- Respons sukses berbentuk `{ "data": ... }`. `apiRequest` mengembalikan payload utuh, jadi baca hasilnya dari `res.data`.
- Respons gagal berbentuk `{ "error": { "code", "message", "details" } }` dan dilempar sebagai `ApiError` (`status`, `code`, `message`, `details`).

**Aksesibilitas (WCAG 2.1 AA):**

- Setiap halaman punya satu `<h1>`; gunakan `useDocumentTitle()` untuk judul tab.
- Skip link + fokus otomatis ke `<main>` saat pindah rute sudah disediakan di `RootLayout`.
- Gambar wajib `alt`, input wajib `<label htmlFor>`, pesan status pakai `aria-live="polite"`.
- Ukuran font dasar 16px, line-height ≥ 1.5, ring fokus kontras (`:focus-visible`).
- ESLint `jsx-a11y` (strict) akan menggagalkan lint bila aturan dasar dilanggar.

**Alur kerja Git:**

- Kerjakan di branch fitur (mis. `feat/…`, `chore/…`), buka Pull Request ke branch default.
- Jalankan `npm run check` sebelum push. CI GitHub Actions menjalankan pemeriksaan yang sama.

## 8. Deploy ke Vercel (ringkas)

1. Import repositori ini di Vercel → framework terdeteksi **Vite**.
2. Build command `npm run build`, output `dist`.
3. Tambahkan `VITE_API_BASE_URL` (URL API Railway) di Environment Variables.
4. `vercel.json` sudah menangani rewrite SPA.

Pastikan origin Vercel didaftarkan di konfigurasi CORS backend.

## 9. Dokumen Terkait

- `docs/flow/01-requirement-mvp.md` — requirement & NFR (aksesibilitas, responsif, keamanan)
- `docs/flow/02-user-flow.md` — alur pengguna & 6 state UI
- `docs/flow/03-system-flow.md` — batas tanggung jawab frontend/backend
- `docs/flow/05-sprint-1-backlog.md` — SP1-01 (setup) & SP1-04 (UI auth)

## Kontribusi

Baca [CONTRIBUTING.md](CONTRIBUTING.md) sebelum membuat branch atau pull request.
