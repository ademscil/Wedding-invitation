import { Hero } from '@/components/marketing/hero';
import { TemplateShowcase } from '@/components/marketing/template-showcase';
import { Features } from '@/components/marketing/features';
import { PricingSection } from '@/components/marketing/pricing-section';
import { Testimonials } from '@/components/marketing/testimonials';
import { FAQ } from '@/components/marketing/faq';

export default function HomePage() {
  return (
    <>
      <Hero />
      <TemplateShowcase />
      <Features />
      <Testimonials />
      <PricingSection />
      <FAQ />
    </>
  );
}
