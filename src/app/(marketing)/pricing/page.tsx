import { Metadata } from 'next';
import { PricingSection } from '@/components/marketing/pricing-section';

export const metadata: Metadata = {
  title: 'Harga',
  description:
    'Pilih paket undangan digital yang sesuai dengan kebutuhan pernikahan Anda. Mulai dari gratis!',
};

export default function PricingPage() {
  return (
    <div className="pt-20">
      <PricingSection />
    </div>
  );
}
