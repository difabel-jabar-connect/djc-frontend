import { AuthProvider } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <CustomerProvider>
        <AppRouter />
      </CustomerProvider>
    </AuthProvider>
  );
}
