import textIcon from '@/assets/icons/a11y-text.svg';
import navIcon from '@/assets/icons/a11y-nav.svg';
import contrastIcon from '@/assets/icons/a11y-contrast.svg';
import SectionHeader from './SectionHeader';

const FEATURES = [
  {
    title: 'Teks mudah dibaca',
    description: 'Font jelas dengan ukuran yang nyaman di mata.',
    icon: textIcon,
  },
  {
    title: 'Navigasi sederhana',
    description: 'Menu mudah dipahami dan bisa dijelajahi dengan keyboard.',
    icon: navIcon,
  },
  {
    title: 'Kontras baik',
    description: 'Warna teks dan latar kontras, nyaman untuk semua pengguna.',
    icon: contrastIcon,
  },
];

/** Section 6. AKSESIBILITAS */
export default function AccessibilitySection() {
  return (
    <section className="home-section" aria-labelledby="a11y-title">
      <div className="container a11y">
        <SectionHeader
          id="a11y-title"
          eyebrow="Aksesibilitas"
          title="Ramah & Aksesibel untuk Semua"
          description="Dirancang bersama prinsip desain inklusif agar setiap orang, termasuk pengguna difabel, dapat memakai platform ini dengan nyaman."
        />
        <ul className="a11y__list">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="a11y__item">
              <span className="a11y__icon">
                <img src={feature.icon} alt="" width="26" height="26" />
              </span>
              <div>
                <h3 className="a11y__title">{feature.title}</h3>
                <p className="a11y__desc">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
