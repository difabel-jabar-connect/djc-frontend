import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProviderProfile } from '@/features/providers/useProviderProfile';
import { startOfDay, upcomingDays } from '@/features/booking/schedule';
import { buildServicesPath, PATHS } from '@/routes/paths';
import { ChevronRightIcon } from '@/components/ui/icons';
import ProfileHeader from './ProfileHeader';
import {
  AboutSection,
  PackagesSection,
  ReviewsSection,
  ScheduleSection,
  StatsSection,
} from './ProfileSections';
import ProfileSidebar from './ProfileSidebar';
import ProviderStatus from './ProviderStatus';
import './providerProfile.css';

const SECTION_LINKS = [
  { id: 'tentang', label: 'Tentang' },
  { id: 'layanan', label: 'Layanan' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'ulasan', label: 'Ulasan' },
  { id: 'lokasi', label: 'Lokasi' },
];

/** Halaman Profil Penyedia (FR-CUST-05). Data dari GET /providers/:id (backend). */
export default function ProviderDetailPage() {
  const { id } = useParams();
  const { status, profile, retry } = useProviderProfile(id);
  useDocumentTitle(
    profile
      ? `${profile.name} · Profil Penyedia`
      : status === 'notfound'
        ? 'Penyedia tidak ditemukan'
        : 'Profil Penyedia',
  );

  if (!profile) {
    return (
      <ProviderStatus
        status={status}
        onRetry={retry}
        notFoundLead="Profil yang Anda cari tidak tersedia atau sudah tidak aktif."
      />
    );
  }
  return <ProviderProfileView key={profile.id} profile={profile} />;
}

function ProviderProfileView({ profile }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [activeSection, setActiveSection] = useState('tentang');
  const days = upcomingDays(startOfDay(new Date()), profile.workDays);

  return (
    <>
      <nav aria-label="Breadcrumb" className="container profile-breadcrumb">
        <ol className="breadcrumb breadcrumb--chevron">
          <li>
            <Link to={PATHS.home}>Beranda</Link>
          </li>
          <li aria-hidden="true">
            <ChevronRightIcon size={18} />
          </li>
          <li>
            <Link to={PATHS.services}>Cari Layanan</Link>
          </li>
          <li aria-hidden="true">
            <ChevronRightIcon size={18} />
          </li>
          <li>
            <Link to={buildServicesPath({ kategori: profile.categorySlug })}>
              {profile.categoryLabel}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRightIcon size={18} />
          </li>
          <li aria-current="page">{profile.name}</li>
        </ol>
      </nav>

      <ProfileHeader profile={profile} selectedDate={selectedDate} />

      <div className="container">
        <nav aria-label="Bagian profil" className="section-tabs">
          {SECTION_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="section-tabs__link"
              aria-current={activeSection === link.id ? 'true' : undefined}
              onClick={() => setActiveSection(link.id)}
            >
              {link.label}
              {link.id === 'ulasan' && (
                <span className="section-tabs__count">{profile.reviewCount}</span>
              )}
            </a>
          ))}
        </nav>
      </div>

      <div className="container profile-layout">
        <div className="profile-main">
          <AboutSection profile={profile} />
          <StatsSection profile={profile} />
          <ScheduleSection
            profile={profile}
            days={days}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <PackagesSection profile={profile} selectedDate={selectedDate} />
          <ReviewsSection profile={profile} />
        </div>
        <ProfileSidebar profile={profile} />
      </div>
    </>
  );
}
