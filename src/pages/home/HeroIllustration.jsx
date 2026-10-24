import decoGroup from '@/assets/home/hero-deco-group.svg';
import tile1 from '@/assets/home/hero-tile-1.svg';
import tile2 from '@/assets/home/hero-tile-2.svg';
import tile3 from '@/assets/home/hero-tile-3.svg';
import tile4 from '@/assets/home/hero-tile-4.svg';
import sparkle1 from '@/assets/home/hero-sparkle-1.svg';
import sparkle2 from '@/assets/home/hero-sparkle-2.svg';
import verifiedIcon from '@/assets/icons/verified.svg';
import starSmall from '@/assets/icons/star-small.svg';
import usersIcon from '@/assets/icons/users.svg';

/** Ilustrasi hero (Figma: "Hero illustration (decorative)"). Murni dekoratif. */
export default function HeroIllustration() {
  return (
    <div className="hero-art" aria-hidden="true">
      <span className="hero-art__circle" />
      <span className="hero-art__ring" />
      <img className="hero-art__dots" src={decoGroup} alt="" width="102" height="78" />
      <span className="hero-art__bubble hero-art__bubble--teal" />
      <span className="hero-art__bubble hero-art__bubble--navy" />
      <span className="hero-art__bubble hero-art__bubble--sky" />

      <div className="hero-art__tile">
        <span className="hero-art__cell">
          <img src={tile1} alt="" width="36" height="36" />
        </span>
        <span className="hero-art__cell hero-art__cell--accent">
          <img src={tile2} alt="" width="36" height="36" />
        </span>
        <span className="hero-art__cell">
          <img src={tile3} alt="" width="36" height="36" />
        </span>
        <span className="hero-art__cell">
          <img src={tile4} alt="" width="36" height="36" />
        </span>
      </div>

      <div className="hero-art__card hero-art__card--verified">
        <span className="hero-art__card-icon">
          <img src={verifiedIcon} alt="" width="22" height="22" />
        </span>
        <span>
          <strong>Penyedia terverifikasi</strong>
          <span className="hero-art__muted">Alumni UPTD PPSGHD</span>
        </span>
      </div>

      <div className="hero-art__card hero-art__card--provider">
        <span className="hero-art__avatar">RM</span>
        <span>
          <strong>Rizki Maulana</strong>
          <span className="hero-art__rating">
            <img src={starSmall} alt="" width="14" height="14" />
            <span className="hero-art__muted">4,9 · Kebersihan</span>
          </span>
        </span>
      </div>

      <div className="hero-art__pill">
        <img src={usersIcon} alt="" width="18" height="18" />
        100+ penyedia aktif
      </div>

      <img className="hero-art__sparkle-1" src={sparkle1} alt="" width="28" height="28" />
      <img className="hero-art__sparkle-2" src={sparkle2} alt="" width="16" height="16" />
    </div>
  );
}
