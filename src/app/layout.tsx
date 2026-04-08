import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Samsara RMS',
  description: 'Reservation Management System — Samsara Travel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full`} style={{ margin: 0, background: '#0D0D0D', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
