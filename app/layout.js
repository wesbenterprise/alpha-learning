import './globals.css';
import PWARegister from './pwa-register';

export const metadata = {
  title: "Alpha Learning — Raleigh's Daily 30",
  description: 'Personalized 5th-grade learning tracker and tutoring experience',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
