import stepSearchIcon from '@/assets/icons/step-search.svg';
import stepOrderIcon from '@/assets/icons/step-order.svg';
import stepUseIcon from '@/assets/icons/step-use.svg';
import SectionHeader from './SectionHeader';

const STEPS = [
  {
    title: 'Cari',
    description:
      'Temukan layanan sesuai kebutuhan berdasarkan kategori, lokasi, atau nama penyedia.',
    icon: stepSearchIcon,
  },
  {
    title: 'Pesan',
    description: 'Hubungi dan pesan penyedia langsung dari halaman profilnya.',
    icon: stepOrderIcon,
  },
  {
    title: 'Gunakan Layanan',
    description: 'Nikmati layanan berkualitas dari alumni difabel Jawa Barat.',
    icon: stepUseIcon,
  },
];

/** Section 5. CARA MENGGUNAKAN */
export default function HowItWorksSection() {
  return (
    <section className="home-section home-section--tinted" aria-labelledby="steps-title">
      <div className="container">
        <SectionHeader
          id="steps-title"
          align="center"
          eyebrow="Cara menggunakan"
          title="Mudah dalam 3 Langkah"
          description="Dari mencari hingga menikmati layanan, semuanya bisa dilakukan dari satu tempat."
        />
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="steps__item">
              <div className="steps__top">
                <span className="steps__icon">
                  <img src={step.icon} alt="" width="30" height="30" />
                </span>
                <span className="steps__number" aria-hidden="true">
                  {index + 1}
                </span>
              </div>
              <h3 className="steps__title">{step.title}</h3>
              <p className="steps__desc">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
