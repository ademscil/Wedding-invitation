'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import { parseSettings, isSectionVisible } from '@/lib/invitation-data';
import type { GalleryImage } from '@/types';
import { parseGalleryImages } from '@/lib/invitation-data';
import { useReducedMotion, SectionHeading } from '../motion';

interface GallerySectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

export function GallerySection({ invitation, theme }: GallerySectionProps) {
  // Owners can hide this section from the invitation settings.
  const visible = isSectionVisible(parseSettings(invitation.settings), 'showGallery');

  const images = parseGalleryImages(invitation.galleryImages);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const reduced = useReducedMotion();

  if (!visible || images.length === 0) return null;

  return (
    <>
      <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
        <div className="mx-auto max-w-4xl">
        <SectionHeading
          title="Galeri Foto"
          subtitle="Momen-momen berharga kami"
          theme={theme}
        />

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {images.map((image, index) => (
              <motion.button
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-lg"
                initial={reduced ? undefined : { opacity: 0, y: 28, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.6,
                  // Column offset staggers each row diagonally rather than
                  // sweeping straight across.
                  delay: (index % 3) * 0.09 + Math.floor(index / 3) * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => setSelectedImage(image)}
                whileHover={reduced ? undefined : { scale: 1.03 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.caption || `Foto galeri ${index + 1}`}
                  className={
                    reduced
                      ? 'h-full w-full object-cover'
                      : 'wi-ken-burns h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
                  }
                  style={reduced ? undefined : { animationDelay: `${(index % 4) * -3}s` }}
                  loading="lazy"
                />
                {image.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="text-xs text-white">{image.caption}</p>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </motion.button>

            <motion.img
              src={selectedImage.url}
              alt={selectedImage.caption || 'Gallery photo'}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            />

            {selectedImage.caption && (
              <motion.p
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-sm text-white/80"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {selectedImage.caption}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
