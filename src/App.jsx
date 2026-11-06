import { MotionConfig } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    // reducedMotion="user": hormati prefers-reduced-motion (tanpa perpindahan, hanya fade).
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <CustomerProvider>
          <AppRouter />
        </CustomerProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
