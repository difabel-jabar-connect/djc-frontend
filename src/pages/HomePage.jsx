import { Link } from 'react-router-dom';
import ApiStatus from '@/components/common/ApiStatus';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { appName } from '@/config/env';
import { PATHS } from '@/routes/paths';

const CORE_FLOW = ['Search', 'Provider', 'Location', 'Booking', 'Review'];

export default function HomePage() {
  useDocumentTitle();

  return (
    <div className="container page">
      <h1>{appName}</h1>
      <p className="lead">
        Platform jasa inklusif yang menghubungkan alumni difabel UPTD PPSGHD Jawa Barat dengan
        masyarakat pengguna jasa.
      </p>

      <ol className="flow" aria-label="Alur inti MVP">
        {CORE_FLOW.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <p>
        <Link to={PATHS.services} className="button">
          Mulai cari layanan
        </Link>
      </p>

      <ApiStatus />
    </div>
  );
}
