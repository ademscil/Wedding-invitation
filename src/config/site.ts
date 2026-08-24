/** Empty or unset reads as "not configured" rather than as a value. */
function configured(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/*
 * Contact details are published on the legal pages and in the footer.
 *
 * These used to fall back to placeholders — support@wedinvite.id and
 * 6281234567890 — which shipped as though they were real. A customer clicking
 * either one reached nobody, and a payment gateway checking that the merchant
 * is contactable would have found a dead address. There is no default now: a
 * missing contact is hidden instead of faked.
 */
const supportEmail = configured(process.env.NEXT_PUBLIC_SUPPORT_EMAIL);
const supportWhatsApp = configured(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP);

export const siteConfig = {
  name: 'WedInvite',
  description: 'Buat undangan pernikahan digital yang elegan dan mudah dibagikan',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.jpg',

  supportEmail,
  supportWhatsApp,

  links: {
    instagram: 'https://instagram.com/wedinvite',
    whatsapp: supportWhatsApp ? `https://wa.me/${supportWhatsApp}` : null,
  },
};
