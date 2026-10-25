import { Fragment } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Halaman sementara untuk rute yang fiturnya belum dibangun.
 * Diganti dengan halaman asli setelah handoff UI/UX.
 */
export default function PlaceholderPage({ title, description, refs = [] }) {
  useDocumentTitle(title);

  return (
    <section className="container page" aria-labelledby="page-title">
      <h1 id="page-title">{title}</h1>
      {description && <p className="lead">{description}</p>}
      <p className="badge">Placeholder — menunggu desain UI/UX</p>
      {refs.length > 0 && (
        <p className="muted">
          Referensi:{' '}
          {refs.map((ref, i) => (
            <Fragment key={ref}>
              {i > 0 && ', '}
              <code>{ref}</code>
            </Fragment>
          ))}
        </p>
      )}
    </section>
  );
}
