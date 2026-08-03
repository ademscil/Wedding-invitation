'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { WeddingRingsScene } from '@/components/3d/wedding-rings-scene';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white px-4 pb-20 pt-20 sm:px-6 sm:pt-24 lg:px-8">
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="pointer-events-none mx-auto mb-2 h-48 w-48 sm:h-64 sm:w-64">
          <WeddingRingsScene className="h-full w-full" />
        </div>

        <motion.h1
          className="relative font-display text-4xl font-bold tracking-tight text-primary-800 sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Buat Undangan Pernikahan Digital yang Elegan
        </motion.h1>

        <motion.p
          className="relative mx-auto mt-6 max-w-2xl text-lg text-primary-600"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Desain undangan digital yang indah dalam hitungan menit. Kirim ke
          seluruh tamu Anda hanya dengan satu tautan &mdash; mudah, cepat, dan
          ramah lingkungan.
        </motion.p>

        <motion.div
          className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
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
