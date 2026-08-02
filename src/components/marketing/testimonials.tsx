'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Rina & Andi',
    role: 'Pengantin, Jakarta',
    quote:
      'WedInvite memudahkan kami membuat undangan digital yang cantik. Tamu-tamu kami sangat terkesan dengan desainnya!',
    rating: 5,
  },
  {
    name: 'Sari & Budi',
    role: 'Pengantin, Bandung',
    quote:
      'Fitur RSVP online sangat membantu kami mengelola jumlah tamu. Prosesnya mudah dan hasilnya profesional.',
    rating: 5,
  },
  {
    name: 'Maya & Dimas',
    role: 'Pengantin, Surabaya',
    quote:
      'Kami hemat biaya cetak dan hasilnya jauh lebih menarik. Amplop digitalnya juga sangat praktis!',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="bg-primary-50/50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary-800 sm:text-4xl">
            Apa Kata Mereka
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-600">
            Ribuan pasangan telah mempercayakan undangan digital mereka kepada
            WedInvite.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-secondary text-secondary"
                  />
                ))}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-primary-700">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="mt-6 border-t border-primary-100 pt-4">
                <p className="font-display text-sm font-semibold text-primary-800">
                  {t.name}
                </p>
                <p className="text-xs text-primary-500">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
