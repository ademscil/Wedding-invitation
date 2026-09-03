'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ShowcaseTemplate {
  id: string;
  name: string;
  category: 'Semua' | 'Modern' | 'Tradisional' | 'Floral' | 'Minimalist';
  description: string;
  palette: string[];
  isPremium?: boolean;
  thumbnail: string;
}

const TEMPLATES: ShowcaseTemplate[] = [
  {
    id: 'floral-vintage',
    name: 'Floral Vintage',
    category: 'Floral',
    description: 'Sentuhan ilustrasi bunga klasik yang anggun, romantis, dan abadi.',
    palette: ['#C48B9F', '#7D5A68', '#FBF7F8'],
    isPremium: true,
    thumbnail: '/templates/floral-vintage.svg',
  },
  {
    id: 'elegant',
    name: 'Elegant Classic',
    category: 'Minimalist',
    description: 'Desain bersahaja dengan tipografi serif mewah dan aksen keemasan.',
    palette: ['#6B4F3A', '#C9A86C', '#FAF6F1'],
    isPremium: false,
    thumbnail: '/templates/thumbnails/elegant.webp',
  },
  {
    id: 'modern',
    name: 'Modern Clean',
    category: 'Modern',
    description: 'Gaya modern kontemporer yang bersih, tegas, dan elegan.',
    palette: ['#1E293B', '#3B82F6', '#F8FAFC'],
    isPremium: false,
    thumbnail: '/templates/thumbnails/modern.webp',
  },
  {
    id: 'islamic',
    name: 'Islamic Grace',
    category: 'Tradisional',
    description: 'Nuansa islami yang penuh berkah dengan ornamen kaligrafi halus.',
    palette: ['#065F46', '#D97706', '#F0FDF4'],
    isPremium: false,
    thumbnail: '/templates/thumbnails/islamic.webp',
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    category: 'Modern',
    description: 'Kemewahan nuansa kerajaan dengan kilau emas dan animasi megah.',
    palette: ['#D4AF37', '#1A1A1A', '#0D0D0D'],
    isPremium: true,
    thumbnail: '/templates/thumbnails/royal-gold.webp',
  },
  {
    id: 'javanese',
    name: 'Javanese Heritage',
    category: 'Tradisional',
    description: 'Kearifan budaya Jawa klasik dengan motif ukiran tradisional adiluhung.',
    palette: ['#5B3A29', '#B8860B', '#FFF8DC'],
    isPremium: false,
    thumbnail: '/templates/thumbnails/javanese.webp',
  },
  {
    id: 'botanical-line',
    name: 'Botanical Line',
    category: 'Floral',
    description: 'Seni garis dedaunan alami yang menenangkan dan mempesona.',
    palette: ['#2D5A27', '#8FBC8F', '#F4F9F4'],
    isPremium: true,
    thumbnail: '/templates/thumbnails/botanical-line.webp',
  },
  {
    id: 'rustic',
    name: 'Rustic Warmth',
    category: 'Minimalist',
    description: 'Hangatnya nuansa kayu alami dan dedaunan kering yang akrab.',
    palette: ['#8B4513', '#CD853F', '#FAF0E6'],
    isPremium: false,
    thumbnail: '/templates/thumbnails/rustic.webp',
  },
];

const CATEGORIES = ['Semua', 'Modern', 'Floral', 'Tradisional', 'Minimalist'] as const;

export function TemplateShowcase() {
  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  const filtered = activeCategory === 'Semua'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <section id="template" className="scroll-mt-20 bg-primary-50/40 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <Badge variant="outline" className="mb-3 border-primary-200 bg-white px-3 py-1 text-xs text-primary">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
            14+ Pilihan Desain Eksklusif
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Pilihan Template Sesuai Impian Anda
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-primary-600 sm:text-lg">
            Setiap template dirancang khusus dengan tipografi anggun, musik latar, galeri foto,
            dan animasi responsif yang nyaman dibuka di smartphone tamu.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                  activeCategory === category
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-primary-700 hover:bg-primary-100/60'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence>
            {filtered.map((template) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Visual Header */}
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback placeholder when thumbnail image is missing
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-primary-900/10 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                    <Button size="sm" variant="secondary" className="shadow-md" asChild>
                      <Link href="/register">
                        <Eye className="mr-1.5 h-4 w-4" />
                        Coba Template
                      </Link>
                    </Button>
                  </div>

                  {template.isPremium && (
                    <div className="absolute left-3 top-3">
                      <Badge className="bg-amber-500 text-white shadow-sm hover:bg-amber-600">
                        Premium
                      </Badge>
                    </div>
                  )}

                  {/* Palette Chips */}
                  <div className="absolute bottom-2.5 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
                    {template.palette.map((color) => (
                      <span
                        key={color}
                        className="h-3 w-3 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-primary-900">
                      {template.name}
                    </h3>
                    <span className="text-xs font-medium text-primary-400">
                      {template.category}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-primary-600">
                    {template.description}
                  </p>

                  <div className="mt-5 border-t border-primary-50 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between border-primary-200 text-primary-700 hover:bg-primary-50"
                      asChild
                    >
                      <Link href="/register">
                        <span>Pilih Template</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm text-primary-600">
            Ingin melihat seluruh 14 koleksi template interaktif?
          </p>
          <Button size="lg" className="mt-4" asChild>
            <Link href="/register">
              Mulai Buat Undangan Sekarang
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
