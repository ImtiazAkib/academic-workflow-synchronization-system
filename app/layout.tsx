import type { Metadata, Viewport } from 'next';

import { Inter, Poppins } from 'next/font/google';

import { APP_DATA } from '@/constants';

import { SiteFooter, SiteHeader } from '@/components/layout';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: `${APP_DATA.NAME}`,
  description: APP_DATA.DESCRIPTION,
  keywords: [
    'academic workflow',
    'class scheduling system',
    'course materials',
    'department management',
    'role-based access control',
    'university dashboard',
    'Next.js MongoDB',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: APP_DATA.SHORT_NAME,
    title: `${APP_DATA.SHORT_NAME} — ${APP_DATA.TAGLINE}`,
    description: APP_DATA.DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_DATA.SHORT_NAME} — ${APP_DATA.TAGLINE}`,
    description: APP_DATA.DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  authors: [{ name: APP_DATA.NAME }],
  other: {
    language: 'en',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  colorScheme: 'light',
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />

          <main className="flex-1">{children}</main>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
