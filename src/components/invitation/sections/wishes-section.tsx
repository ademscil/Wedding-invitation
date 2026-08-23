'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Invitation, Wish } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import { parseSettings, isSectionVisible } from '@/lib/invitation-data';
import { trpcQuery, trpcMutate, PublicApiError } from '@/lib/public-api';

interface WishesSectionProps {
  invitation: Invitation & { wishes: Wish[] };
  theme: TemplateTheme;
  guestName?: string;
}

export function WishesSection({
  invitation,
  theme,
  guestName,
}: WishesSectionProps) {
  // Owners can hide this section from the invitation settings.
  const visible = isSectionVisible(parseSettings(invitation.settings), 'showGuestbook');

  const [wishes, setWishes] = useState<Wish[]>(invitation.wishes || []);
  const [name, setName] = useState(guestName || '');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchWishes = useCallback(async () => {
    try {
      const data = await trpcQuery<{ wishes: Wish[] }>('wish.list', {
        invitationSlug: invitation.slug,
        limit: 50,
      });
      if (data?.wishes) setWishes(data.wishes);
    } catch {
      // A failed refresh leaves the existing list on screen; nothing to report.
    }
  }, [invitation.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await trpcMutate('wish.create', {
        invitationSlug: invitation.slug,
        guestName: name.trim(),
        message: message.trim(),
      });

      setMessage('');
      await fetchWishes();
    } catch (err) {
      setError(
        err instanceof PublicApiError
          ? err.message
          : 'Gagal mengirim ucapan. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

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
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.colors.primary + '15' }}
          >
            <MessageCircle
              size={24}
              style={{ color: theme.colors.primary }}
            />
          </div>
          <h2
            className="mb-2 text-3xl sm:text-4xl"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
            }}
          >
            Ucapan & Doa
          </h2>
          <p
            className="text-sm tracking-widest"
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
            }}
          >
            Berikan ucapan terbaik untuk kedua mempelai
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div>
            <input
              id="wish-name"
              name="wish-name"
              type="text"
              autoComplete="name"
              aria-label="Nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda"
              required
              maxLength={100}
              className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm outline-none"
              style={{
                borderColor: theme.colors.secondary + '40',
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
              }}
            />
          </div>

          <div>
            <textarea
              id="wish-message"
              name="wish-message"
              aria-label="Ucapan dan doa"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis ucapan dan doa Anda..."
              required
              maxLength={500}
              rows={4}
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
            disabled={isSubmitting || !name.trim() || !message.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium uppercase tracking-wider text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: theme.colors.primary }}
          >
            {isSubmitting ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Send size={16} />
                Kirim Ucapan
              </>
            )}
          </button>
        </motion.form>

        {/* Wishes List */}
        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {wishes.map((wish, index) => (
            <motion.div
              key={wish.id}
              className="rounded-xl border p-4"
              style={{ borderColor: theme.colors.secondary + '30' }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="mb-1 flex items-center justify-between">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  {wish.guestName}
                </p>
                <span
                  className="text-xs"
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  {formatDistanceToNow(new Date(wish.createdAt), {
                    addSuffix: true,
                    locale: id,
                  })}
                </span>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                }}
              >
                {wish.message}
              </p>
            </motion.div>
          ))}

          {wishes.length === 0 && (
            <p
              className="py-8 text-center text-sm"
              style={{
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.body,
              }}
            >
              Belum ada ucapan. Jadilah yang pertama!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
