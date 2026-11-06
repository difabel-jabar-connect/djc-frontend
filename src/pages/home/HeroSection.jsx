import { useState } from 'react';
import { Link } from 'react-router';
import TopoCanvas from '@/components/motif/TopoCanvas';
import { projectToShape } from '@/features/map/jabarShape';
import { SAMPLE_PROVIDERS } from '@/features/providers/sampleProviders';
import { CATEGORIES } from '@/features/search/catalog';
import { PATHS, buildServicesPath } from '@/routes/paths';

const DEFAULT_TRADE = 'kuliner';

/**
 * Hero Beranda (satu kolom di tengah): judul, kalimat, tombol, pemilih keahlian, lalu peta
 * kontur Jawa Barat 3D. Pilih keahlian → pin kota alumni keahlian itu muncul di peta.
 */
export default function HeroSection() {
  const [trade, setTrade] = useState(DEFAULT_TRADE);
  const category = CATEGORIES.find((c) => c.slug === trade);
  const providers = SAMPLE_PROVIDERS.filter((p) => p.categorySlug === trade);
  const pins = providers.map((p) => ({ id: p.id, label: p.city, ...projectToShape(p.lat, p.lng) }));

  return (
    <section className="hero-motif" aria-labelledby="hero-title">
      <div className="hero-motif__text">
        <h1 id="hero-title" className="hero-motif__title lines">
          <span className="line">
            <span data-line style={{ '--i': 0 }}>
              Jasa alumni
            </span>
          </span>{' '}
          <span className="line">
            <span data-line style={{ '--i': 1 }}>
              difabel Jabar
            </span>
          </span>
        </h1>
        <p className="hero-motif__lead" data-load style={{ '--d': '420ms' }}>
          Pesan penjahit, tukang servis, pemijat, pembuat kue, desainer, atau petugas kebersihan
          lulusan UPTD PPSGHD, dengan harga yang jelas sejak awal.
        </p>
        <div data-load style={{ '--d': '480ms' }}>
          <Link to={PATHS.services} className="btn btn--primary btn--lg">
            Cari Layanan
          </Link>
        </div>

        <fieldset className="trade-picker">
          <legend className="trade-picker__legend">Lihat alumni di peta</legend>
          <div className="trade-picker__options">
            {CATEGORIES.map((c) => (
              <label key={c.slug} className="trade-picker__option">
                <input
                  type="radio"
                  name="hero-trade"
                  value={c.slug}
                  checked={trade === c.slug}
                  onChange={() => setTrade(c.slug)}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          <p className="trade-picker__result" aria-live="polite">
            {providers.length} alumni {category.label.toLowerCase()} di peta ·{' '}
            <Link to={buildServicesPath({ kategori: trade })}>
              Lihat semua
              <span className="visually-hidden"> penyedia {category.label}</span>
            </Link>
          </p>
        </fieldset>
      </div>

      <div className="hero-motif__figure">
        <TopoCanvas pins={pins} />
      </div>
    </section>
  );
}
