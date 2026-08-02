import Link from 'next/link';

const productLinks = [
  { label: 'Template', href: '#template' },
  { label: 'Fitur', href: '#fitur' },
  { label: 'Harga', href: '#harga' },
];

const companyLinks = [
  { label: 'Tentang', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Kontak', href: '/contact' },
];

const helpLinks = [
  { label: 'FAQ', href: '#faq' },
  { label: 'Panduan', href: '/guide' },
  { label: 'Dukungan', href: '/support' },
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
              Perusahaan
            </h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
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
                  {link.href.startsWith('#') ? (
                    <a
                      href={link.href}
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
