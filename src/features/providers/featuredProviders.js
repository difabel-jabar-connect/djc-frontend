import { SAMPLE_PROVIDERS } from './sampleProviders';

const FEATURED_IDS = ['rizki-maulana', 'siti-nurjanah', 'deni-setiawan', 'lina-kurnia'];

/**
 * Penyedia unggulan di Beranda (urutan sesuai desain).
 * Ganti dengan respons API penyedia setelah endpoint tersedia.
 */
export const FEATURED_PROVIDERS = FEATURED_IDS.map((id) =>
  SAMPLE_PROVIDERS.find((provider) => provider.id === id),
);
