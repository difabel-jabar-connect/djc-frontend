import AppRouter from './routes/AppRouter';

/**
 * Titik komposisi aplikasi. Provider global (AuthContext, dsb.)
 * akan dibungkus di sini pada sprint berikutnya.
 */
export default function App() {
  return <AppRouter />;
}
