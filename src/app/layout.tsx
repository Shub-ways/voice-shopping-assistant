import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Voice Shopping Assistant',
  description:
    'Add items to your shopping list using your voice. Smart suggestions, multilingual support, and offline-ready.',
  keywords: ['shopping list', 'voice commands', 'NLP', 'grocery', 'PWA'],
  authors: [{ name: 'Voice Shopping Assistant' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Voice Shopping',
  },
  openGraph: {
    title: 'Voice Shopping Assistant',
    description: 'Hands-free shopping list management with voice commands',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
