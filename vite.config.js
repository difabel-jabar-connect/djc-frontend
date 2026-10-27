import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    env: {
      // Nilai khusus pengujian, bukan URL backend sungguhan.
      VITE_API_BASE_URL: 'http://api.test/api/v1',
      // Abaikan Client ID Google dari .env.local; test Google mengatur sendiri lewat vi.stubEnv.
      VITE_GOOGLE_CLIENT_ID: '',
    },
  },
});
