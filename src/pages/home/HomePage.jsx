import ApiStatus from '@/components/common/ApiStatus';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SHOW_API_STATUS } from '@/config/devFlags';
import { useAuth } from '@/context/useAuth';
import HeroSection from './HeroSection';
import FeaturedProvidersSection from './FeaturedProvidersSection';
import ServiceMapSection from './ServiceMapSection';
import RouteMapSection from './RouteMapSection';
import AccessibilitySection from './AccessibilitySection';
import './home.css';
import CustomerHome from './CustomerHome';

export default function HomePage() {
  useDocumentTitle();
  const { user } = useAuth();

  if (user?.role === 'customer') return <CustomerHome />;

  return (
    <>
      <HeroSection />
      <ServiceMapSection />
      <RouteMapSection />
      <FeaturedProvidersSection />
      <AccessibilitySection />

      {/* Panel cek koneksi backend (SP1-01) hanya untuk development, dikontrol lewat src/config/devFlags.js. */}
      {SHOW_API_STATUS && (
        <div className="container home-dev-status">
          <ApiStatus />
        </div>
      )}
    </>
  );
}
