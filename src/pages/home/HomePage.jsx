import ApiStatus from '@/components/common/ApiStatus';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { isDev } from '@/config/env';
import HeroSection from './HeroSection';
import FeaturedProvidersSection from './FeaturedProvidersSection';
import ServiceMapSection from './ServiceMapSection';
import HowItWorksSection from './HowItWorksSection';
import AccessibilitySection from './AccessibilitySection';
import './home.css';

export default function HomePage() {
  useDocumentTitle();

  return (
    <>
      <HeroSection />
      <FeaturedProvidersSection />
      <ServiceMapSection />
      <HowItWorksSection />
      <AccessibilitySection />

      {/* Panel cek koneksi backend (SP1-01) hanya untuk development, tidak ada di desain. */}
      {isDev && (
        <div className="container home-dev-status">
          <ApiStatus />
        </div>
      )}
    </>
  );
}
