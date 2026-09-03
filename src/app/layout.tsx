import type { Metadata } from 'next';
import {
  Playfair_Display,
  Plus_Jakarta_Sans,
  Inter,
  Great_Vibes,
} from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  variable: '--font-great-vibes',
  weight: '400',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://saas-wedding-two.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'WedInvite: Buat Undangan Pernikahan Digital Gratis & Elegan 5 Menit Jadi',
    template: '%s | WedInvite',
  },
  description:
    'Platform pembuat undangan pernikahan digital online gratis & premium. Desain elegan responsif, RSVP otomatis, amplop digital, QR code check-in tamu, & musik kustom.',
  keywords: [
    'undangan pernikahan digital',
    'undangan online gratis',
    'buat undangan nikah',
    'undangan digital pernikahan',
    'wedding invitation indonesia',
    'buku tamu digital qr code',
    'undangan digital islami',
    'undangan pernikahan murah',
    'website undangan pernikahan',
  ],
  authors: [{ name: 'WedInvite Team' }],
  creator: 'WedInvite',
  publisher: 'WedInvite',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'WedInvite: Buat Undangan Pernikahan Digital Gratis & Elegan',
    description:
      'Buat undangan pernikahan digital online elegan dalam 5 menit. Dilengkapi RSVP, galeri foto, amplop digital cashless, dan QR check-in tamu.',
    url: siteUrl,
    siteName: 'WedInvite',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WedInvite: Undangan Pernikahan Digital Elegan',
    description:
      'Platform undangan pernikahan digital modern & praktis. Bagikan ke ratusan tamu via WhatsApp dengan mudah.',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'WedInvite',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '1840',
    bestRating: '5',
    worstRating: '1',
  },
  description:
    'Platform pembuatan undangan pernikahan digital online terlengkap dan elegan di Indonesia dengan RSVP instan dan QR check-in.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body
        className={`${playfair.variable} ${jakarta.variable} ${inter.variable} ${greatVibes.variable} font-sans antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
