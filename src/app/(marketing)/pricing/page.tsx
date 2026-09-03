import { Metadata } from 'next';
import { PricingSection } from '@/components/marketing/pricing-section';

export const metadata: Metadata = {
  title: 'Paket & Harga Undangan Digital Pernikahan Mulai Rp 49.000',
  description:
    'Daftar harga paket pembuatan undangan pernikahan online digital terlengkap dan termurah. Paket Starter Rp 49rb dengan 15 foto & musik latar, tanpa biaya tersembunyi.',
  openGraph: {
    title: 'Harga Paket Undangan Pernikahan Digital - WedInvite',
    description:
      'Pilih paket undangan pernikahan digital yang sesuai. Mulai gratis hingga paket lengkap mulai Rp 49.000 sekali bayar.',
  },
};

export default function PricingPage() {
  return (
    <div className="pt-20">
      <PricingSection />
    </div>
  );
}
