import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PATHS, buildProviderPath } from '@/routes/paths';
import { formatRating } from '@/lib/format';
import { getSampleProvider } from '@/features/providers/sampleProviders';
import SectionHeader from '@/pages/home/SectionHeader';
import { StatusBadge } from '@/pages/customer/BookingParts';
import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  CompassIcon,
  ContrastIcon,
  DevicesIcon,
  FilterIcon,
  GraduationIcon,
  HeartIcon,
  HelpCircleIcon,
  ImageIcon,
  InfoIcon,
  KeyboardIcon,
  LayersIcon,
  LightbulbIcon,
  MapFoldIcon,
  MapPinIcon,
  PersonIcon,
  PointerClickIcon,
  QuoteOutlineIcon,
  RotateCwIcon,
  SearchIcon,
  ShieldIcon,
  SparkleIcon,
  StarFilledIcon,
  StarOutlineIcon,
  TagIcon,
  TypeIcon,
  WalletIcon,
} from '@/components/ui/icons';
import { AboutHeroArt, AboutServiceMap } from './AboutArt';
import './about.css';

const BEFORE = [
  { label: 'Jenis layanan', icon: LayersIcon },
  { label: 'Profil penyedia', icon: PersonIcon },
  { label: 'Harga layanan', icon: TagIcon },
  { label: 'Lokasi penyedia', icon: MapPinIcon },
  { label: 'Jadwal & ketersediaan', icon: CalendarIcon },
  { label: 'Cara memesan', icon: ClipboardCheckIcon },
  { label: 'Ulasan layanan', icon: StarOutlineIcon },
];

const VALUES = [
  {
    title: 'Mudah Digunakan',
    text: 'Alur sederhana dari mencari hingga memesan.',
    icon: PointerClickIcon,
  },
  {
    title: 'Inklusif',
    text: 'Bisa dipakai semua orang, termasuk penyandang disabilitas.',
    icon: HeartIcon,
  },
  {
    title: 'Berbasis Lokasi',
    text: 'Penyedia terdekat tampil langsung di peta.',
    icon: MapPinIcon,
  },
];

const FLOW = [
  {
    title: 'Cari',
    text: 'Temukan layanan berdasarkan nama, kategori, lokasi, atau penyedia.',
    icon: SearchIcon,
  },
  {
    title: 'Pilih Penyedia',
    text: 'Lihat profil, keterampilan, harga, dan rating.',
    icon: PersonIcon,
  },
  { title: 'Lihat Lokasi', text: 'Cek posisi penyedia di peta interaktif.', icon: MapFoldIcon },
  { title: 'Pesan', text: 'Pilih layanan, tanggal, waktu, dan alamat.', icon: CalendarIcon },
  {
    title: 'Layanan Berjalan',
    text: 'Penyedia menerima dan mengerjakan pesanan.',
    icon: RotateCwIcon,
  },
  {
    title: 'Beri Ulasan',
    text: 'Nilai layanan dengan rating 1–5 dan komentar.',
    icon: StarOutlineIcon,
  },
];

const STATUS_FLOW = ['menunggu', 'diterima', 'berjalan', 'selesai'];

const MAP_FEATURES = [
  {
    title: 'Marker lokasi penyedia',
    text: 'Setiap penyedia tampil sebagai pin di titik lokasinya.',
    icon: MapPinIcon,
  },
  {
    title: 'Info singkat saat pin diklik',
    text: 'Nama, layanan, dan rating muncul dalam popup.',
    icon: PointerClickIcon,
  },
  {
    title: 'Filter berdasarkan kategori',
    text: 'Tampilkan hanya layanan yang Anda butuhkan.',
    icon: FilterIcon,
  },
  {
    title: 'Langsung ke profil penyedia',
    text: 'Satu klik dari peta ke halaman profil.',
    icon: PersonIcon,
  },
];

const A11Y = [
  { title: 'Font mudah dibaca', text: 'Plus Jakarta Sans, minimal 16px.', icon: TypeIcon },
  { title: 'Kontras warna cukup', text: 'Memenuhi rasio kontras WCAG AA.', icon: ContrastIcon },
  { title: 'Navigasi sederhana', text: 'Menu singkat dan konsisten.', icon: CompassIcon },
  { title: 'Label di setiap form', text: 'Setiap isian punya label terlihat.', icon: TagIcon },
  {
    title: 'Teks alternatif pada gambar',
    text: 'Gambar penting diberi deskripsi.',
    icon: ImageIcon,
  },
  {
    title: 'Navigasi dengan keyboard',
    text: 'Semua fitur bisa dipakai tanpa mouse.',
    icon: KeyboardIcon,
  },
  { title: 'Tampilan responsif', text: 'Nyaman di laptop, tablet, dan ponsel.', icon: DevicesIcon },
];

const PARTNERS = [
  {
    name: 'Alumni PPSGHD',
    text: 'Penyedia layanan: alumni yang menawarkan keterampilan mereka kepada masyarakat.',
    icon: GraduationIcon,
  },
  {
    name: 'UPTD PPSGHD Jawa Barat',
    text: 'Pembina dan pengelola: memverifikasi penyedia dan menjaga kualitas layanan.',
    icon: ShieldIcon,
  },
];

/** Contoh popup pin di peta (penyedia dari data contoh). */
const MAP_SAMPLE = getSampleProvider('deni-setiawan');

/** Gulir ke #anchor saat datang dari halaman lain (mis. tautan "Kontak" di footer). */
function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    target.scrollIntoView?.({ block: 'start' });
    target.focus?.({ preventScroll: true });
  }, [hash]);
}

/** Halaman Tentang (desain difabel-jabar-connect-tentang). */
export default function AboutPage() {
  useDocumentTitle('Tentang');
  useHashScroll();

  return (
    <>
      {/* Hero */}
      <section className="about-hero" aria-labelledby="about-title">
        <div className="container about-hero__inner">
          <div className="about-hero__content">
            <p className="about-badge">
              <SparkleIcon size={16} />
              Tentang Difabel Jabar Connect
            </p>
            <h1 id="about-title" className="about-hero__title">
              Menghubungkan <span>Keterampilan</span> dengan Kebutuhan
            </h1>
            <p className="about-hero__lead">
              Difabel Jabar Connect adalah platform layanan berbasis lokasi yang mempertemukan
              alumni penyandang disabilitas UPTD PPSGHD Jawa Barat dengan masyarakat yang
              membutuhkan jasa mereka.
            </p>
            <div>
              <Link to={PATHS.services} className="btn btn--primary btn--md">
                <SearchIcon />
                Cari Layanan
              </Link>
            </div>
          </div>
          <div className="about-hero__visual">
            <AboutHeroArt />
          </div>
        </div>
      </section>

      {/* Latar belakang */}
      <section className="home-section home-section--tinted" aria-labelledby="latar-title">
        <div className="container about-split">
          <div className="about-split__text">
            <SectionHeader
              id="latar-title"
              eyebrow="Latar belakang"
              title="Keterampilan Sudah Ada, Aksesnya yang Belum"
            />
            <p className="about-lead">
              Alumni UPTD PPSGHD telah memiliki keterampilan dan siap melayani masyarakat. Namun,
              akses pasar mereka masih terbatas karena belum ada media yang menghubungkan penyedia
              jasa dengan calon pengguna.
            </p>
          </div>
          <div className="about-split__cards">
            <div className="about-card">
              <h3 id="sulit-title" className="about-card__title">
                Sebelumnya, masyarakat sulit menemukan:
              </h3>
              <ul className="about-checklist" aria-labelledby="sulit-title">
                {BEFORE.map(({ label, icon: Icon }) => (
                  <li key={label}>
                    <span className="about-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="about-solution">
              <span className="about-solution__icon" aria-hidden="true">
                <LightbulbIcon size={24} />
              </span>
              <p>
                <strong>Solusinya:</strong> satu tempat untuk mencari, memesan, dan menilai layanan
                — lengkap dengan peta lokasi penyedia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tujuan */}
      <section className="home-section" aria-labelledby="tujuan-title">
        <div className="container about-goal">
          <h2 id="tujuan-title" className="section-header__eyebrow about-goal__eyebrow">
            Tujuan kami
          </h2>
          <figure className="about-goal__quote">
            <span className="about-goal__mark" aria-hidden="true">
              <QuoteOutlineIcon size={26} />
            </span>
            <blockquote>
              “Menghubungkan keterampilan alumni difabel dengan kebutuhan masyarakat melalui
              platform layanan digital yang mudah digunakan, inklusif, dan berbasis lokasi.”
            </blockquote>
          </figure>
          <ul className="about-values" aria-label="Nilai platform">
            {VALUES.map(({ title, text, icon: Icon }) => (
              <li key={title} className="about-card about-card--center">
                <span className="about-icon about-icon--lg" aria-hidden="true">
                  <Icon size={24} />
                </span>
                <div>
                  <h3 className="about-card__heading">{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cara kerja */}
      <section className="home-section home-section--tinted" aria-labelledby="cara-title">
        <div className="container">
          <SectionHeader
            id="cara-title"
            align="center"
            eyebrow="Cara kerja"
            title="Satu Alur dari Cari hingga Ulasan"
            description="Dari menemukan penyedia sampai memberi ulasan, semua langkah ada di satu platform."
          />
          <ol className="about-flow" aria-label="Alur penggunaan">
            {FLOW.map(({ title, text, icon: Icon }, index) => (
              <li key={title}>
                <span className="about-flow__badge" aria-hidden="true">
                  <Icon size={30} />
                  <span className="about-flow__number">{String(index + 1).padStart(2, '0')}</span>
                </span>
                <div>
                  <h3 className="about-card__heading">
                    <span className="visually-hidden">Langkah {index + 1}: </span>
                    {title}
                  </h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="about-flow-notes">
            <div className="about-card">
              <h3 id="status-title" className="about-card__title">
                Status pesanan
              </h3>
              <ol className="about-status" aria-labelledby="status-title">
                {STATUS_FLOW.map((status, index) => (
                  <li key={status}>
                    <StatusBadge status={status} />
                    {index < STATUS_FLOW.length - 1 && (
                      <ChevronRightIcon
                        size={20}
                        strokeWidth={2.5}
                        className="about-status__arrow"
                      />
                    )}
                  </li>
                ))}
              </ol>
              <p className="about-note">
                <InfoIcon size={18} />
                Pesanan dapat dibatalkan sebelum selesai.
              </p>
            </div>
            <div className="about-card about-card--row">
              <span className="about-icon about-icon--lg" aria-hidden="true">
                <WalletIcon size={24} />
              </span>
              <p className="about-card__strong">
                Pembayaran dilakukan langsung kepada penyedia, di luar platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Peta layanan */}
      <section className="home-section" aria-labelledby="peta-title">
        <div className="container about-map">
          <figure className="about-map__figure">
            <div className="about-map__canvas">
              <AboutServiceMap />
              <div className="about-map__popup">
                <div className="about-map__popup-head">
                  <span
                    className="booking-avatar"
                    style={{ backgroundColor: MAP_SAMPLE.avatarColor, '--avatar-size': '40px' }}
                    aria-hidden="true"
                  >
                    {MAP_SAMPLE.initials}
                  </span>
                  <span>
                    <strong>{MAP_SAMPLE.name}</strong>
                    <span className="about-map__popup-meta">
                      {MAP_SAMPLE.category} · <StarFilledIcon size={14} className="text-star" />
                      <span className="visually-hidden">rating</span>
                      <strong>{formatRating(MAP_SAMPLE.rating)}</strong>
                    </span>
                  </span>
                </div>
                <Link
                  to={buildProviderPath(MAP_SAMPLE.id)}
                  aria-label={`Lihat detail ${MAP_SAMPLE.name}`}
                >
                  Lihat detail →
                </Link>
              </div>
            </div>
            <figcaption className="visually-hidden">
              Contoh peta layanan: titik penyedia di Bekasi, Bogor, Cimahi, Bandung, Cirebon, dan
              Tasikmalaya, dengan popup info penyedia.
            </figcaption>
          </figure>
          <div className="about-map__info">
            <SectionHeader
              id="peta-title"
              eyebrow="Peta layanan"
              title="Lokasi adalah Inti Platform"
              description="Setiap penyedia ditampilkan sesuai titik lokasinya, sehingga Anda bisa menemukan layanan terdekat dengan mudah."
            />
            <ul className="about-features">
              {MAP_FEATURES.map(({ title, text, icon: Icon }) => (
                <li key={title}>
                  <span className="about-icon about-icon--md" aria-hidden="true">
                    <Icon size={22} />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="about-note about-note--sm">
              <MapFoldIcon size={16} />
              Peta menggunakan OpenStreetMap.
            </p>
          </div>
        </div>
      </section>

      {/* Aksesibilitas */}
      <section className="home-section home-section--tinted" aria-labelledby="akses-title">
        <div className="container">
          <SectionHeader
            id="akses-title"
            eyebrow="Aksesibilitas"
            title="Dibuat untuk dan oleh Penyandang Disabilitas"
            description="Aksesibilitas bukan fitur tambahan, melainkan bagian inti dari platform ini. Desain kami mengacu pada prinsip dasar WCAG."
          />
          <ul className="about-a11y">
            {A11Y.map(({ title, text, icon: Icon }) => (
              <li key={title} className="about-card">
                <span className="about-icon about-icon--lg" aria-hidden="true">
                  <Icon size={24} />
                </span>
                <div>
                  <h3 className="about-card__heading">{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
            <li className="about-card about-card--accent">
              <span className="about-icon about-icon--lg about-icon--navy" aria-hidden="true">
                <HelpCircleIcon size={24} />
              </span>
              <div>
                <h3 className="about-card__heading">Ada kendala akses?</h3>
                <a href="#kontak" className="link-arrow">
                  Hubungi kami
                  <ArrowRightIcon size={18} />
                </a>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Kolaborasi — juga tujuan tautan "Kontak" di footer */}
      <section
        id="kontak"
        tabIndex={-1}
        className="home-section about-partners-section"
        aria-labelledby="kolab-title"
      >
        <div className="container">
          <SectionHeader
            id="kolab-title"
            align="center"
            eyebrow="Kolaborasi"
            title="Bekerja Sama dengan"
            description="Platform ini lahir dari kolaborasi untuk membuka akses pasar bagi alumni difabel."
          />
          <ul className="about-partners">
            {PARTNERS.map(({ name, text, icon: Icon }) => (
              <li key={name} className="about-card about-card--row">
                <span className="about-partners__icon" aria-hidden="true">
                  <Icon size={30} />
                </span>
                <div>
                  <h3 className="about-partners__name">{name}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="container about-cta-wrap" aria-labelledby="cta-title">
        <div className="about-cta">
          <h2 id="cta-title">Mari Wujudkan Jawa Barat yang Lebih Inklusif</h2>
          <p>Temukan layanan dari alumni difabel di sekitar Anda, mudah, dekat, dan terpercaya.</p>
          <Link to={PATHS.services} className="btn btn--md about-cta__btn">
            <SearchIcon strokeWidth={2.25} />
            Cari Layanan
          </Link>
        </div>
      </section>
    </>
  );
}
