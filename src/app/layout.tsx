import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Toaster from '@/components/ui/Toaster';

// Optimize font loading: use font-display: swap for faster first paint
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',              // Show fallback font while Inter loads
  preload: true,
  weight: ['400', '500', '600', '700'], // Only load needed weights
});

export const metadata: Metadata = {
  title: 'Samsara RMS',
  description: 'Reservation Management System — Samsara Travel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Prefetch DNS for critical domains */}
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.className} min-h-full`} style={{ margin: 0, background: '#0D0D0D', color: '#fff' }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
