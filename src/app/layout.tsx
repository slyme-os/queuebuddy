import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Archivo, Onest, Martian_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { DemoBar } from '@/components/layout/DemoBar';
import { ServiceWorker } from '@/components/layout/ServiceWorker';
import { appUrl } from '@/lib/config';

const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', display: 'swap' });
const onest = Onest({ subsets: ['latin'], variable: '--font-onest', display: 'swap' });
const martianMono = Martian_Mono({ subsets: ['latin'], variable: '--font-martian-mono', display: 'swap' });

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : appUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'QueueBuddy Bengaluru: Skip government office queues',
    template: '%s · QueueBuddy',
  },
  description:
    'Book a verified Queue Buddy to hold your spot at RTO, Sub-Registrar, Passport Seva Kendra and BBMP offices in Bengaluru. Arrive only when your turn is near.',
  applicationName: 'QueueBuddy',
  manifest: '/manifest.json',
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon-192.png' },
  openGraph: {
    type: 'website',
    siteName: 'QueueBuddy',
    title: 'QueueBuddy Bengaluru: Skip government office queues',
    description: 'Verified, language-matched buddies hold your place in line. Track the queue live and arrive when called.',
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512 }],
  },
  twitter: { card: 'summary', title: 'QueueBuddy Bengaluru', description: 'Skip government office queues in Bengaluru.' },
  appleWebApp: { capable: true, title: 'QueueBuddy', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#06080D',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${archivo.variable} ${onest.variable} ${martianMono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-amber-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
        >
          Skip to content
        </a>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <DemoBar />
              <Suspense>{children}</Suspense>
              <ServiceWorker />
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
