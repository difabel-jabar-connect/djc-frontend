/** Eyebrow + judul + deskripsi section (pola berulang di Beranda). */
export default function SectionHeader({ id, eyebrow, title, description, align = 'start' }) {
  return (
    <div className={`section-header section-header--${align}`}>
      <p className="section-header__eyebrow">{eyebrow}</p>
      <h2 id={id} className="section-header__title">
        {title}
      </h2>
      {description && <p className="section-header__desc">{description}</p>}
    </div>
  );
}
