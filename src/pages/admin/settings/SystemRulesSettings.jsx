import { useId } from 'react';
import {
  ClockIcon,
  InfoIcon,
  MailIcon,
  MapIcon,
  MessageStarIcon,
  PhoneIcon,
  WalletIcon,
} from '@/components/ui/icons';
import { SYSTEM_RULES } from '@/features/admin/settingsData';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ReadOnlyBadge } from '../AdminParts';

const RULE_ICONS = {
  clock: ClockIcon,
  phone: PhoneIcon,
  review: MessageStarIcon,
  wallet: WalletIcon,
  mail: MailIcon,
  map: MapIcon,
};

/** Pengaturan · Aturan Sistem (hanya baca, mengikuti SRS). */
export default function SystemRulesSettings() {
  useDocumentTitle('Pengaturan · Aturan Sistem');
  const id = useId();
  return (
    <section className="dash-card st-card" aria-labelledby={`${id}-title`}>
      <div className="st-card__head st-card__head--row">
        <div>
          <h2 id={`${id}-title`} className="st-card__title">
            Aturan Sistem
          </h2>
          <p className="st-card__desc">Aturan yang berlaku untuk seluruh pengguna platform.</p>
        </div>
        <ReadOnlyBadge small />
      </div>
      <p className="st-note st-note--muted">
        <InfoIcon size={18} />
        Aturan ini mengikuti dokumen kebutuhan sistem (SRS). Hubungi tim pengembang untuk
        mengubahnya.
      </p>
      <dl className="st-rules-grid">
        {SYSTEM_RULES.map((rule) => {
          const Icon = RULE_ICONS[rule.icon];
          return (
            <div key={rule.label} className="st-rule">
              <span className="st-rule__icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <div className="st-rule__text">
                <dt>{rule.label}</dt>
                <dd className="st-rule__value">{rule.value}</dd>
                <dd className="st-rule__note">{rule.note}</dd>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
