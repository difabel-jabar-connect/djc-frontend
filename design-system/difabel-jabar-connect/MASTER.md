# Design System — Difabel Jabar Connect

Sumber desain utama. Disusun dengan **tasteskill v2** (anti-slop): arah halaman dibagikan oleh
`draw.mjs`, diperiksa oleh `lint.mjs` dan `inspect.mjs` di browser sungguhan, lalu dikritik dari
screenshot. Implementasi: `src/styles/tokens.css`, `src/styles/global.css`,
`src/components/motif/`, `src/components/dashboard/dashboard.css` (lapisan app).

## 1. Arah halaman (page) — "One motif"

- Draw: `draw.mjs --sector nonprofit --keep palette --direction one-motif`, seed **1023298568**.
- **Ide:** siluet Provinsi Jawa Barat dengan pin harga para alumni menjadi satu-satunya motif:
  bentuk raksasa di hero (berisi foto Jawa Barat yang berganti pelan), masker setiap foto, dan
  penutup footer.
- **Live thing:** pemilih keahlian di hero → pin harga alumni keahlian itu muncul di kotanya
  (tautan ke profil, bisa dipakai keyboard & jempol, ada tautan "Lihat semua" sebagai cadangan).
- **Section (blueprint):** hero split motif → peta sebaran "square plate" (peta SIG + tab wilayah)
  → cara memesan "tiles that grow" (potongan antarmuka sungguhan `data-ui`) → penyedia unggulan
  "folder bertab" → aksesibilitas "inset panel" → footer "the mark, built large".
- Penyesuaian: folder tidak ditumpuk sticky (aturan _covered-text_ lebih tinggi dari blueprint);
  tidak memakai video karena tidak ada rekaman Jawa Barat yang jujur di koleksi terbuka.

## 2. Warna (palet merek dipertahankan)

| Peran                | Token                                      | Nilai                              |
| -------------------- | ------------------------------------------ | ---------------------------------- |
| Latar                | `--color-paper`                            | `#F1F3F6` batu dingin (bukan krem) |
| Permukaan            | `--color-bg` / `--color-surface`           | `#FFFFFF` / `#E4E8EE` (satu nada)  |
| Tinta                | `--color-text`                             | `#0F1A2A` (16:1)                   |
| Teks sekunder        | `--color-text-body` / `--color-text-muted` | `#26324A` / `#4A5566`              |
| Aksen (aksi & motif) | `--color-primary`                          | `#0B3C6E` navy merek               |
| Teal merek           | `--color-accent`                           | `#0B6B67`                          |
| Field gelap          | `--color-night`                            | `#0F1A2A`                          |

Tidak ada: krem + terakota, ungu/indigo, gradien (kecuali scrim netral di atas foto), bayangan
pada elemen diam, garis 1px dekoratif. Permukaan dibedakan oleh beda nada.

## 3. Tipografi

Satu keluarga: **Albert Sans** 400/500/600. Skala 5 langkah: small 13–14 · body 17–19 ·
lead 20–26 · head 32–64 · display (hero) hingga 84px. Judul ≤ 2 baris di 1440/768/390,
tracking −0.035 s.d. −0.045em, leading ~1. Tanpa eyebrow, tanpa mono, tanpa label kapital
berjarak, tanpa penomoran 01/02/03, tanpa kata aksen bergaya di judul.

## 4. Bentuk & tata letak

- Panel & foto **persegi**; tombol & chip **bulat penuh** (seperti pin harga di peta).
- Margin luar sama kiri-kanan: `--margin` 16–32px; kontainer hingga 1760px.
- Jarak antar-section 72–160px; satu `h1` di layar pertama; setiap section punya judul.
- Header: bar polos ikut tergulir (tidak menutupi isi).

## 5. Gambar

Minimal 4 foto asli per halaman (Beranda 9, Tentang 5), dari Wikimedia Commons berlisensi
terbuka, kredit di footer (`src/features/content/photoCredits.js`). Foto menunjukkan dunia di
sekitar layanan (lanskap Jawa Barat, alat keahlian), **bukan** foto penyedia/pelanggan.
Foto tampil di dalam siluet Jawa Barat (`JabarMotif`).

## 6. Gerak

Token `--ease-out/expo/in-out/soft`, `--t-press 140ms` … `--t-open 1200ms`. Signature: crossfade
pelan foto hero (±6 dtk, berhenti saat tab tersembunyi). Urutan masuk hero ≤ 1,2 dtk (baris judul
naik dari masker, kalimat & tombol muncul, siluet terbuka). Tiap section punya cara masuk sendiri
(pelat peta shutter, petak naik berurutan, panel teks berurutan, balok footer tumbuh). Semua di
dalam `prefers-reduced-motion: no-preference` + kelas `.js`; isi terlihat tanpa JS.

## 7. Layar aplikasi — "Framed sheet"

- Draw: `draw.mjs --app --kind commerce --keep palette,type --style framed-sheet`,
  seed **78940106**. Berlaku untuk Admin, Pengelola, Dashboard Penyedia; layar kerja lain
  (Cari Layanan, Pesan, Pesanan, Chat, Masuk/Daftar, Profil) diperiksa dengan aturan app.
- Sidebar + bar atas = satu bingkai L `#EEF1F5` tanpa garis; kerja di lembar putih (inset 8px
  kanan & bawah, sudut 16px, tepi 1px `#E1E6EC`, tanpa bayangan). Menu aktif = pil abu.
- KPI = label + angka (tanpa ikon dalam kotak berwarna); angka tabular; judul layar 24–32px.
- Radius di dalam app: 6 / 10 / 12 / 16px.

## 8. Pemeriksaan

`node <skill>/scripts/lint.mjs <src>` dan `node <skill>/scripts/inspect.mjs <url> [--app]`
pada build produksi (`vite build && vite preview`). Target: 0 FAIL di 1440, 768, 390.
