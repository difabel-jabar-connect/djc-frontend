/** Ilustrasi dekoratif profil penyedia (desain HTML Profil Penyedia). Semua aria-hidden. */

/** Banner bertema menjahit (mesin jahit, gunting, benang). */
export function SewingBannerArt() {
  return (
    <svg
      className="profile-card__banner-art"
      width="380"
      height="190"
      viewBox="0 0 380 190"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="250" cy="80" r="70" fill="#fff" opacity="0.55" />
      <path
        d="M20 170 C60 150 90 178 130 160 C170 142 200 172 240 156"
        fill="none"
        stroke="#14a3a3"
        strokeWidth="3"
        strokeDasharray="6 7"
        strokeLinecap="round"
      />
      <rect x="150" y="160" width="210" height="20" rx="8" fill="#0b3c6e" />
      <path
        d="M170 160 V82 a22 22 0 0 1 22 -22 H320 a22 22 0 0 1 22 22 V112 H306 V100 H210 V160 Z"
        fill="#fff"
        stroke="#0b3c6e"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect x="300" y="70" width="42" height="56" rx="10" fill="#14a3a3" />
      <path d="M321 126 V148" stroke="#0b3c6e" strokeWidth="3" strokeLinecap="round" />
      <rect x="306" y="146" width="30" height="8" rx="3" fill="#0b3c6e" />
      <circle cx="190" cy="100" r="15" fill="#e3f6f6" stroke="#0b3c6e" strokeWidth="4" />
      <rect x="232" y="40" width="26" height="20" rx="5" fill="#0c7272" />
      <rect x="228" y="36" width="34" height="6" rx="3" fill="#0b3c6e" />
      <rect x="228" y="58" width="34" height="6" rx="3" fill="#0b3c6e" />
      <path
        d="M245 64 C255 80 300 74 318 92"
        fill="none"
        stroke="#0c7272"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <rect x="222" y="74" width="64" height="8" rx="4" fill="#c9e3f2" />
      <g transform="translate(64 96) rotate(-24)">
        <circle cx="0" cy="0" r="12" fill="none" stroke="#0b3c6e" strokeWidth="4" />
        <circle cx="0" cy="34" r="12" fill="none" stroke="#0b3c6e" strokeWidth="4" />
        <path d="M10 6 L62 30" stroke="#0b3c6e" strokeWidth="5" strokeLinecap="round" />
        <path d="M10 28 L62 4" stroke="#14a3a3" strokeWidth="5" strokeLinecap="round" />
      </g>
      <path d="M120 40 L122 48 L130 50 L122 52 L120 60 L118 52 L110 50 L118 48 Z" fill="#14a3a3" />
      <circle cx="36" cy="40" r="5" fill="#b6d4e8" />
      <circle cx="56" cy="30" r="3" fill="#b6d4e8" />
    </svg>
  );
}

const PACKAGE_ART = {
  permak: (
    <>
      <path
        d="M28 8 L16 14 L6 30 L16 36 L20 30 V66 H64 V30 L68 36 L78 30 L68 14 L56 8 C54 14 48 18 42 18 C36 18 30 14 28 8 Z"
        fill="#fff"
        stroke="#0b3c6e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M30 44 H54"
        stroke="#14a3a3"
        strokeWidth="3"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <path d="M60 52 L74 38" stroke="#0b3c6e" strokeWidth="3" strokeLinecap="round" />
      <circle cx="75" cy="37" r="3" fill="none" stroke="#0b3c6e" strokeWidth="2" />
    </>
  ),
  custom: (
    <>
      <rect x="8" y="50" width="68" height="14" rx="3" fill="#14a3a3" />
      <path
        d="M16 50 V56 M26 50 V58 M36 50 V56 M46 50 V58 M56 50 V56 M66 50 V58"
        stroke="#fff"
        strokeWidth="2"
      />
      <path
        d="M36 8 H48 L52 18 L60 22 L56 44 H28 L24 22 L32 18 Z"
        fill="#fff"
        stroke="#0b3c6e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="42" cy="28" r="2" fill="#0b3c6e" />
      <circle cx="42" cy="36" r="2" fill="#0b3c6e" />
    </>
  ),
  muslim: (
    <>
      <path
        d="M42 6 C30 6 24 16 24 26 L14 66 H70 L60 26 C60 16 54 6 42 6 Z"
        fill="#fff"
        stroke="#0b3c6e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M32 24 C34 18 50 18 52 24 C50 30 34 30 32 24 Z"
        fill="#e3f6f6"
        stroke="#0b3c6e"
        strokeWidth="2.5"
      />
      <path
        d="M26 44 C36 48 48 48 58 44"
        fill="none"
        stroke="#14a3a3"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M22 56 C34 60 50 60 62 56"
        fill="none"
        stroke="#14a3a3"
        strokeWidth="3"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
    </>
  ),
};

/** Ilustrasi paket; tanpa ilustrasi khusus → ikon kategori penyedia. */
export function PackageArt({ art, fallbackIcon }) {
  if (PACKAGE_ART[art]) {
    return (
      <svg width="84" height="72" viewBox="0 0 84 72" aria-hidden="true" focusable="false">
        {PACKAGE_ART[art]}
      </svg>
    );
  }
  return fallbackIcon ? <img src={fallbackIcon} alt="" width="40" height="40" /> : null;
}
