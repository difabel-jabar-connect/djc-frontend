import { Link } from 'react-router';
import { PATHS } from '@/routes/paths';
import {
  ArrowRightIcon,
  HeartIcon,
  MessageIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@/components/ui/icons';

const TRUST_POINTS = [
  {
    title: 'Profil Terverifikasi',
    text: 'Identitas dan keahlian sudah dicek.',
    icon: ShieldCheckIcon,
  },
  { title: 'Ulasan Pengguna', text: 'Ulasan asli dari pelanggan.', icon: MessageIcon },
  { title: 'Dukungan Alumni PPSGHD', text: 'Didampingi jaringan alumni.', icon: UsersIcon },
  {
    title: 'Bersama Mewujudkan Jawa Barat Inklusif',
    text: 'Setiap pesanan memberdayakan alumni.',
    icon: HeartIcon,
  },
];

/** Peta area layanan: lingkaran jangkauan di sekitar kota pusat. */
function ServiceAreaMap({ profile }) {
  const labels = profile.areaMap?.labels ?? [];
  const description =
    profile.areaMap?.description ??
    `pusat di ${profile.city}, menjangkau ${profile.serviceAreas.join(', ')}`;
  const centerLabel = `${profile.city} (Pusat Layanan)`;
  const labelWidth = Math.max(156, centerLabel.length * 8.5);

  return (
    <svg
      className="area-map"
      viewBox="0 0 342 260"
      role="img"
      aria-label={`Peta area layanan: ${description}`}
    >
      <rect width="342" height="260" rx="12" fill="#e8f3fa" />
      <path
        d="M18 40 C60 20 120 26 170 18 C230 10 290 24 326 40 L330 236 C280 248 200 244 150 248 C90 252 40 246 14 236 Z"
        fill="#fff"
      />
      <g fill="none" stroke="#dce7f1" strokeWidth="6" strokeLinecap="round">
        <path d="M30 70 C110 100 230 90 320 70" />
        <path d="M60 230 C110 170 140 120 171 60" />
        <path d="M300 230 C250 170 210 140 175 128" />
      </g>
      <circle
        cx="171"
        cy="132"
        r="78"
        fill="#14a3a3"
        fillOpacity="0.1"
        stroke="#14a3a3"
        strokeWidth="2.5"
        strokeDasharray="7 7"
      />
      <g className="area-map__labels" textAnchor="middle">
        {labels.map(({ name, x, y, box: [bx, by, bw] }) => (
          <g key={name}>
            <circle cx={x} cy={y} r="5" fill="#6b7280" />
            <rect x={bx} y={by} width={bw} height="24" rx="8" fill="#fff" stroke="#cbd5e1" />
            <text x={x} y={by + 17}>
              {name}
            </text>
          </g>
        ))}
      </g>
      <g transform="translate(171 132)">
        <path
          d="M0 0 C-2 -7 -15 -15 -15 -28 A15 15 0 1 1 15 -28 C15 -15 2 -7 0 0 Z"
          fill="#0b3c6e"
          stroke="#fff"
          strokeWidth="3"
        />
        <circle cx="0" cy="-28" r="5.5" fill="#14a3a3" />
        <rect x={-labelWidth / 2} y="8" width={labelWidth} height="28" rx="10" fill="#0b3c6e" />
        <text className="area-map__center" x="0" y="27" textAnchor="middle">
          {centerLabel}
        </text>
      </g>
    </svg>
  );
}

export default function ProfileSidebar({ profile }) {
  return (
    <aside className="profile-aside" aria-label="Informasi tambahan">
      <section id="lokasi" className="side-card" aria-labelledby="area-title">
        <h2 id="area-title" className="side-card__title">
          Area Layanan
        </h2>
        <ServiceAreaMap profile={profile} />
        <Link to={PATHS.map} className="link-arrow link-arrow--offset">
          Lihat Peta Lebih Besar
          <ArrowRightIcon />
        </Link>
      </section>

      <section className="trust-card" aria-labelledby="aman-title">
        <h2 id="aman-title" className="side-card__title">
          Layanan Terpercaya &amp; Aman
        </h2>
        <ul className="trust-card__list">
          {TRUST_POINTS.map(({ title, text, icon: Icon }) => (
            <li key={title}>
              <span className="icon-tile icon-tile--white" aria-hidden="true">
                <Icon size={22} />
              </span>
              <span>
                <strong>{title}</strong>
                <span className="trust-card__text">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
