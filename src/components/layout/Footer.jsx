import { appName } from '@/config/env';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="container">
        <p>
          © {new Date().getFullYear()} {appName} — bersama alumni UPTD PPSGHD Jawa Barat.
        </p>
      </div>
    </footer>
  );
}
