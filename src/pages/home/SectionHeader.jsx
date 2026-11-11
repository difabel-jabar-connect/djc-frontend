/**
 * Judul + deskripsi section. Tanpa label kecil di atas judul: informasinya ada di judul
 * atau kalimat pertama (tasteskill: no eyebrows).
 */
export default function SectionHeader({ id, title, description, align = 'start' }) {
  return (
    <div className={`section-header section-header--${align}`}>
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {description && <p className="section-header__desc">{description}</p>}
    </div>
  );
}
