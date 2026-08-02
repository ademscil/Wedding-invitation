'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <motion.h1
          className="font-display text-4xl font-bold tracking-tight text-primary-800 sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Buat Undangan Pernikahan Digital yang Elegan
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-primary-600"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Desain undangan digital yang indah dalam hitungan menit. Kirim ke
          seluruh tamu Anda hanya dengan satu tautan &mdash; mudah, cepat, dan
          ramah lingkungan.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Button size="xl" asChild>
            <Link href="/register">Buat Undangan Gratis</Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <a href="#template">Lihat Template</a>
          </Button>
        </motion.div>
      </div>

      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-secondary-200/30 blur-3xl"
      />
    </section>
  );
}
