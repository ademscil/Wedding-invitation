'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import { trackEvent } from '@/lib/public-api';

interface ShareSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

export function ShareSection({ invitation, theme }: ShareSectionProps) {
  const [copied, setCopied] = useState(false);

  const couple = `${invitation.brideName} & ${invitation.groomName}`;

  /** The public URL, without any personal-link segment the current guest may be on. */
  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${invitation.slug}`
      : `/${invitation.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent(invitation.slug, 'SHARE', { method: 'copy' });
    } catch {
      setCopied(false);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Undangan pernikahan ${couple}\n${publicUrl}`
    );
    trackEvent(invitation.slug, 'SHARE', { method: 'whatsapp' });
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return handleCopy();
    try {
      await navigator.share({
        title: `Undangan Pernikahan ${couple}`,
        text: `Kami mengundang Anda ke pernikahan ${couple}`,
        url: publicUrl,
      });
      trackEvent(invitation.slug, 'SHARE', { method: 'native' });
    } catch {
      // The guest dismissed the share sheet; nothing to do.
    }
  };

  const buttonStyle = {
    borderColor: theme.colors.secondary + '60',
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  };

  return (
    <section className="px-6 py-16" style={{ backgroundColor: theme.colors.background }}>
      <motion.div
        className="mx-auto max-w-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.colors.primary + '15' }}
        >
          <Share2 size={22} style={{ color: theme.colors.primary }} />
        </div>

        <h2
          className="mb-2 text-2xl sm:text-3xl"
          style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
        >
          Bagikan Undangan
        </h2>
        <p
          className="mb-6 text-sm"
          style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
        >
          Bantu sebarkan kabar bahagia ini kepada kerabat lainnya
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={handleWhatsApp}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-80"
            style={buttonStyle}
          >
            <MessageCircle size={14} />
            WhatsApp
          </button>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-80"
            style={{
              ...buttonStyle,
              ...(copied && {
                borderColor: theme.colors.primary,
                color: theme.colors.primary,
              }),
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Tersalin' : 'Salin Link'}
          </button>

          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Share2 size={14} />
            Bagikan
          </button>
        </div>
      </motion.div>
    </section>
  );
}
