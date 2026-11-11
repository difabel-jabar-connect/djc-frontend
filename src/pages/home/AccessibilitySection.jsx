import { Link } from 'react-router';
import { useInViewClass } from '@/hooks/useInViewClass';
import { PATHS } from '@/routes/paths';

const FEATURES = [
  {
    title: 'Teks mudah dibaca',
    description:
      'Huruf besar dengan jarak lega, isi minimal 17 piksel, dan bisa diperbesar sampai 200% tanpa terpotong.',
  },
  {
    title: 'Navigasi sederhana',
    description:
      'Semua tombol, peta, dan formulir bisa dipakai dengan keyboard dan pembaca layar, dengan fokus yang selalu terlihat.',
  },
  {
    title: 'Kontras baik',
    description:
      'Teks dan latar memenuhi kontras WCAG AA, dan gerakan halaman berhenti bila Anda memilih kurangi animasi.',
  },
];

/** Section AKSESIBILITAS — judul di kiri, tiga penjelasan di kanan, dalam satu panel putih. */
export default function AccessibilitySection() {
  const ref = useInViewClass();
  return (
    <section ref={ref} className="a11y-panel" aria-labelledby="a11y-title">
      <div className="a11y-panel__lead">
        <h2 id="a11y-title" className="section-title a11y-panel__title">
          Ramah &amp; Aksesibel untuk Semua
        </h2>
        <Link to={PATHS.about} className="btn btn--outline a11y-panel__action">
          Tentang aksesibilitas kami
        </Link>
      </div>
      <ul className="a11y-panel__list">
        {FEATURES.map((feature, i) => (
          <li key={feature.title} style={{ '--i': i }}>
            <h3 className="a11y-panel__name">{feature.title}</h3>
            <p className="a11y-panel__desc">{feature.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
