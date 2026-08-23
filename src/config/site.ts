export const siteConfig = {
  name: 'WedInvite',
  description: 'Buat undangan pernikahan digital yang elegan dan mudah dibagikan',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.jpg',

  /*
   * Contact details are published on the legal pages and in the footer.
   * Payment gateways check that a merchant is reachable, and a customer who
   * cannot find a way to ask for help charges back instead.
   *
   * Override these per deployment; the defaults are placeholders.
   */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@wedinvite.id',
  supportWhatsApp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '6281234567890',

  links: {
    instagram: 'https://instagram.com/wedinvite',
    whatsapp: `https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '6281234567890'}`,
  },
};
