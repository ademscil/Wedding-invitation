'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Send } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import { SectionHeading, Celebration } from '../motion';
import { parseSettings, isSectionVisible } from '@/lib/invitation-data';
import { trpcMutate, PublicApiError } from '@/lib/public-api';

interface RsvpSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
  guestName?: string;
  personalLink?: string;
  existingRsvp?: {
    status: string;
    guestCount?: number | null;
    dietaryNotes?: string | null;
  };
}

type RsvpStatus = 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE';

export function RsvpSection({
  invitation,
  theme,
  guestName,
  personalLink,
  existingRsvp,
}: RsvpSectionProps) {
  // Owners can hide this section from the invitation settings.
  const visible = isSectionVisible(parseSettings(invitation.settings), 'showRsvp');

  const hasExistingRsvp = Boolean(
    existingRsvp &&
      existingRsvp.status &&
      existingRsvp.status !== 'PENDING'
  );
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const [name, setName] = useState(guestName || '');
  const [status, setStatus] = useState<RsvpStatus | ''>(
    (existingRsvp?.status as RsvpStatus) || ''
  );
  const [guestCount, setGuestCount] = useState(existingRsvp?.guestCount || 1);
  const [dietaryNotes, setDietaryNotes] = useState(existingRsvp?.dietaryNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !status) return;

    setIsSubmitting(true);
    setError('');

    try {
      await trpcMutate('guest.submitRsvp', {
        invitationSlug: invitation.slug,
        personalLink: personalLink || undefined,
        name: name.trim(),
        status,
        guestCount,
        dietaryNotes: dietaryNotes.trim() || undefined,
      });

      setIsSubmitted(true);
    } catch (err) {
      setError(
        err instanceof PublicApiError
          ? err.message
          : 'Gagal mengirim RSVP. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  const statusOptions: { value: RsvpStatus; label: string; emoji: string }[] = [
    { value: 'ATTENDING', label: 'Hadir', emoji: '' },
    { value: 'NOT_ATTENDING', label: 'Tidak Hadir', emoji: '' },
    { value: 'MAYBE', label: 'Mungkin', emoji: '' },
  ];

  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <div className="mx-auto max-w-lg">
        <SectionHeading
          title="Konfirmasi Kehadiran"
          subtitle="Kami menantikan kehadiran Anda"
          theme={theme}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {isSubmitted ? (
            <motion.div
              className="relative overflow-hidden rounded-2xl border p-8 text-center"
              style={{ borderColor: theme.colors.secondary + '40' }}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Celebration
                colors={[
                  theme.colors.primary,
                  theme.colors.secondary,
                  theme.colors.accent,
                ]}
              />

              <motion.div
                className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.colors.primary + '15' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 }}
              >
                <motion.span
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.35 }}
                >
                  <Check size={32} style={{ color: theme.colors.primary }} />
                </motion.span>
              </motion.div>

              <h3
                className="mb-2 text-xl"
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading,
                }}
              >
                Terima Kasih!
              </h3>
              <p
                className="text-sm"
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                }}
              >
                Konfirmasi kehadiran Anda telah kami terima.
              </p>
            </motion.div>
          ) : hasExistingRsvp && !isEditingExisting ? (
            <motion.div
              className="relative overflow-hidden rounded-2xl border p-8 text-center"
              style={{
                borderColor: theme.colors.secondary + '40',
                backgroundColor: theme.colors.secondary + '0a',
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div
                className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.colors.primary + '18' }}
              >
                <Check size={28} style={{ color: theme.colors.primary }} />
              </div>
              <h3
                className="mb-1 text-xl"
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading,
                }}
              >
                Terima Kasih, {name}!
              </h3>
              <p
                className="text-sm"
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                }}
              >
                Konfirmasi kehadiran Anda telah tercatat:{' '}
                <strong style={{ color: theme.colors.primary }}>
                  {status === 'ATTENDING'
                    ? `Hadir (${guestCount} orang)`
                    : status === 'NOT_ATTENDING'
                    ? 'Tidak Dapat Hadir'
                    : 'Mungkin Hadir'}
                </strong>
              </p>
              {dietaryNotes && (
                <p
                  className="mt-2 text-xs italic"
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  &ldquo;{dietaryNotes}&rdquo;
                </p>
              )}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditingExisting(true)}
                  className="inline-flex items-center rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-80"
                  style={{
                    borderColor: theme.colors.secondary + '80',
                    color: theme.colors.text,
                    backgroundColor: 'transparent',
                    fontFamily: theme.fonts.body,
                  }}
                >
                  Ubah Konfirmasi
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="rsvp-name"
                  className="mb-1.5 block text-xs uppercase tracking-wider"
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  Nama
                </label>
                <input
                  id="rsvp-name"
                  name="rsvp-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  required
                  className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                  style={{
                    borderColor: theme.colors.secondary + '40',
                    color: theme.colors.text,
                    fontFamily: theme.fonts.body,
                  }}
                />
              </div>

              {/* Attendance */}
              <div>
                <label
                  className="mb-2 block text-xs uppercase tracking-wider"
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  Konfirmasi Kehadiran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className="rounded-lg border px-3 py-3 text-sm transition-all"
                      style={{
                        borderColor:
                          status === option.value
                            ? theme.colors.primary
                            : theme.colors.secondary + '40',
                        backgroundColor:
                          status === option.value
                            ? theme.colors.primary + '15'
                            : 'transparent',
                        color:
                          status === option.value
                            ? theme.colors.primary
                            : theme.colors.text,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Count */}
              {status === 'ATTENDING' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <label
                    htmlFor="rsvp-guest-count"
                    className="mb-1.5 block text-xs uppercase tracking-wider"
                    style={{
                      color: theme.colors.textMuted,
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    Jumlah Tamu
                  </label>
                  <select
                    id="rsvp-guest-count"
                    name="rsvp-guest-count"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm outline-none"
                    style={{
                      borderColor: theme.colors.secondary + '40',
                      color: theme.colors.text,
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'orang' : 'orang'}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}

              {/* Dietary Notes */}
              <div>
                <label
                  htmlFor="rsvp-notes"
                  className="mb-1.5 block text-xs uppercase tracking-wider"
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  Catatan (opsional)
                </label>
                <textarea
                  id="rsvp-notes"
                  name="rsvp-notes"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="Alergi makanan, preferensi khusus, dll."
                  rows={3}
                  className="w-full resize-none rounded-lg border bg-transparent px-4 py-3 text-sm outline-none"
                  style={{
                    borderColor: theme.colors.secondary + '40',
                    color: theme.colors.text,
                    fontFamily: theme.fonts.body,
                  }}
                />
              </div>

              {error && (
                <p
                  className="text-center text-sm text-red-500"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !status}
                className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium uppercase tracking-wider text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {isSubmitting ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send size={16} />
                    Kirim RSVP
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
