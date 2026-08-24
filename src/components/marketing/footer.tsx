import Link from 'next/link';
import { siteConfig } from '@/config/site';

/*
 * Every entry here must resolve. The footer previously linked to /about,
 * /blog, /contact, /guide and /support — five 404s on the front page of a
 * product asking for money.
 */
const productLinks = [
  { label: 'Template', href: '#template' },
  { label: 'Fitur', href: '#fitur' },
  { label: 'Harga', href: '/pricing' },
];

const legalLinks = [
  { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
  { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
];

/*
 * A contact that has not been configured is left out entirely. Listing
 * "WhatsApp" that opens a chat with nobody is worse than not listing it.
 */
const helpLinks = [
  { label: 'FAQ', href: '#faq' },
  ...(siteConfig.supportEmail
    ? [
        {
          label: 'Email Dukungan',
          href: `mailto:${siteConfig.supportEmail}`,
          external: true,
        },
      ]
    : []),
  ...(siteConfig.links.whatsapp
    ? [{ label: 'WhatsApp', href: siteConfig.links.whatsapp, external: true }]
    : []),
];

export function Footer() {
  return (
    <footer className="bg-primary-900 text-primary-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-2xl font-bold text-white">
              WedInvite
            </Link>
            <p className="mt-3 text-sm text-primary-300">
              Platform undangan pernikahan digital premium. Buat momen spesial
              Anda lebih berkesan.
            </p>
          </div>

          {/* Produk */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Produk
            </h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-primary-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Perusahaan */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Legal
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Bantuan
            </h3>
            <ul className="space-y-2">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('#') || link.external ? (
                    <a
                      href={link.href}
                      {...(link.external && link.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="text-sm text-primary-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-primary-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-800 pt-6 text-center text-sm text-primary-400">
          &copy; 2026 WedInvite. Semua hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
