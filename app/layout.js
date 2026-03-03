import './globals.css';

export const metadata = {
  title: "Alpha Learning — Raleigh's Daily 30",
  description: 'Personalized 5th-grade learning tracker and tutoring experience',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
