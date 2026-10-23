import { useParams } from 'react-router-dom';
import PlaceholderPage from '@/components/common/PlaceholderPage';

export default function ProviderDetailPage() {
  const { id } = useParams();

  return (
    <PlaceholderPage
      title="Profil Penyedia Jasa"
      description={`Detail profil, layanan, portofolio, dan ulasan penyedia (ID: ${id}).`}
      refs={['FR-CUST-05', 'US-CUST-04']}
    />
  );
}
