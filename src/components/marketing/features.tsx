'use client';

import { motion } from 'framer-motion';
import {
  Palette,
  ClipboardCheck,
  Wallet,
  Image,
  Heart,
  Timer,
  QrCode,
  BarChart3,
} from 'lucide-react';

const features = [
  {
    icon: Palette,
    title: 'Template Premium',
    description: 'Pilihan template elegan yang bisa disesuaikan dengan tema pernikahan Anda.',
  },
  {
    icon: ClipboardCheck,
    title: 'RSVP Online',
    description: 'Kelola konfirmasi kehadiran tamu secara real-time dengan mudah.',
  },
  {
    icon: Wallet,
    title: 'Amplop Digital',
    description: 'Terima hadiah secara digital melalui berbagai metode pembayaran.',
  },
  {
    icon: Image,
    title: 'Galeri Foto',
    description: 'Tampilkan momen terbaik Anda dalam galeri foto yang menawan.',
  },
  {
    icon: Heart,
    title: 'Love Story',
    description: 'Ceritakan kisah cinta Anda dengan timeline yang interaktif.',
  },
  {
    icon: Timer,
    title: 'Hitung Mundur',
    description: 'Buat antisipasi dengan countdown menuju hari bahagia Anda.',
  },
  {
    icon: QrCode,
    title: 'QR Check-in',
    description: 'Proses check-in tamu lebih cepat dengan scan QR code.',
  },
  {
    icon: BarChart3,
    title: 'Analitik',
    description: 'Pantau jumlah views, RSVP, dan statistik undangan Anda.',
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function Features() {
  return (
    <section id="fitur" className="scroll-mt-20 bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary-800 sm:text-4xl">
            Fitur Lengkap untuk Hari Spesial Anda
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-600">
            Semua yang Anda butuhkan untuk membuat undangan pernikahan digital
            yang sempurna, dalam satu platform.
          </p>
        </div>

        <motion.div
          className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="rounded-xl border border-primary-100 bg-primary-50/50 p-6 text-center transition-shadow hover:shadow-md"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-primary-800">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-primary-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
