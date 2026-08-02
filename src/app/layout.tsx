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

export const metadata: Metadata = {
  title: {
    default: 'WedInvite - Undangan Pernikahan Digital',
    template: '%s | WedInvite',
  },
  description:
    'Buat undangan pernikahan digital yang elegan dan mudah dibagikan. Template premium, RSVP, amplop digital, dan banyak lagi.',
  keywords: [
    'undangan pernikahan digital',
    'undangan online',
    'wedding invitation',
    'undangan nikah',
    'e-invitation',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${jakarta.variable} ${inter.variable} ${greatVibes.variable} font-sans antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
