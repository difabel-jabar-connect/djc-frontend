import { Link } from 'react-router';
import { PATHS } from '@/routes/paths';
import { ArrowRightIcon, MessageIcon } from '@/components/ui/icons';

/** Kartu ajakan "Belum menemukan layanan?" di sidebar. */
export default function RequestHelpCard() {
  return (
    <section className="help-card" aria-labelledby="bantuan-title">
      <span className="help-card__icon" aria-hidden="true">
        <MessageIcon size={26} />
      </span>
      <div className="help-card__text">
        <h2 id="bantuan-title" className="side-card__title">
          Belum menemukan layanan yang Anda butuhkan?
        </h2>
        <p>Kirim permintaan Anda. Tim kami akan membantu mencarikan alumni yang sesuai.</p>
      </div>
      <Link to={`${PATHS.about}#kontak`} className="btn btn--outline btn--block help-card__cta">
        Ajukan Permintaan Layanan
        <ArrowRightIcon />
      </Link>
    </section>
  );
}
