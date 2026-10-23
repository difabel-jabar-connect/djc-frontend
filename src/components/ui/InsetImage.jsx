import './InsetImage.css';

/**
 * Potongan ilustrasi/ikon vektor yang diposisikan relatif terhadap kotak induk,
 * mengikuti geometri layer di Figma. `inset` = posisi layer, `bleed` = ruang
 * ekstra (inset negatif) untuk stroke/bayangan yang keluar dari batas layer.
 * Selalu dekoratif; induknya yang memberi teks alternatif.
 */
export default function InsetImage({ src, inset, bleed, className = '' }) {
  return (
    <span className={`inset-image ${className}`.trim()} style={{ inset }} aria-hidden="true">
      {bleed ? (
        <span className="inset-image__bleed" style={{ inset: bleed }}>
          <img src={src} alt="" />
        </span>
      ) : (
        <img src={src} alt="" />
      )}
    </span>
  );
}
