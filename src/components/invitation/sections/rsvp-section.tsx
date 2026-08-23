'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Send } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import { parseSettings, isSectionVisible } from '@/lib/invitation-data';
import { trpcMutate, PublicApiError } from '@/lib/public-api';

interface RsvpSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
  guestName?: string;
  personalLink?: string;
}

type RsvpStatus = 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE';

export function RsvpSection({
  invitation,
  theme,
  guestName,
  personalLink,
}: RsvpSectionProps) {
  // Owners can hide this section from the invitation settings.
  const visible = isSectionVisible(parseSettings(invitation.settings), 'showRsvp');

  const [name, setName] = useState(guestName || '');
  const [status, setStatus] = useState<RsvpStatus | ''>('');
  const [guestCount, setGuestCount] = useState(1);
  const [dietaryNotes, setDietaryNotes] = useState('');
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
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="mb-2 text-3xl sm:text-4xl"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
            }}
          >
            Konfirmasi Kehadiran
          </h2>
          <p
            className="text-sm tracking-widest"
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
            }}
          >
            Kami menantikan kehadiran Anda
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {isSubmitted ? (
            <motion.div
              className="rounded-2xl border p-8 text-center"
              style={{ borderColor: theme.colors.secondary + '40' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.colors.primary + '15' }}
              >
                <Check
                  size={32}
                  style={{ color: theme.colors.primary }}
                />
              </div>
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
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  className="mb-1.5 block text-xs uppercase tracking-wider"
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  Nama
                </label>
                <input
                  type="text"
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
                    className="mb-1.5 block text-xs uppercase tracking-wider"
                    style={{
                      color: theme.colors.textMuted,
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    Jumlah Tamu
                  </label>
                  <select
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
                  className="mb-1.5 block text-xs uppercase tracking-wider"
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  Catatan (opsional)
                </label>
                <textarea
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
