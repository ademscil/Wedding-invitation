'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, MapPin, Clock } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import type { InvitationEvent } from '@/types';
import { parseEvents, buildCalendarUrl } from '@/lib/invitation-data';
import { useReducedMotion, SectionHeading } from '../motion';
import { coupleNames } from '@/lib/invitation-data';

interface EventsSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

function generateCalendarUrl(event: InvitationEvent, couple: string): string | null {
  return buildCalendarUrl(event, couple);
}

export function EventsSection({ invitation, theme }: EventsSectionProps) {
  const reduced = useReducedMotion();
  const events = parseEvents(invitation.events);
  const couple = coupleNames(invitation);

  if (events.length === 0) return null;

  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          title="Acara Pernikahan"
          subtitle="Rangkaian acara yang akan diselenggarakan"
          theme={theme}
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {events.map((event, index) => {
            const parsedDate = event.date ? new Date(event.date) : null;
            const formattedDate =
              parsedDate && !Number.isNaN(parsedDate.getTime())
                ? format(parsedDate, 'EEEE, d MMMM yyyy', { locale: id })
                : event.date;
            const calendarUrl = generateCalendarUrl(event, couple);

            return (
              <motion.div
                key={event.id}
                className="rounded-2xl border p-6 text-center"
                style={{
                  borderColor: theme.colors.secondary + '40',
                  backgroundColor: theme.colors.background,
                }}
                // Cards alternate their entrance side so a two-column row
                // converges on the centre rather than sliding as one block.
                initial={
                  reduced
                    ? undefined
                    : { opacity: 0, y: 36, x: index % 2 === 0 ? -20 : 20 }
                }
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.75,
                  delay: index * 0.14,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={reduced ? undefined : { y: -6 }}
              >
                <h3
                  className="mb-4 text-xl font-semibold uppercase tracking-wider"
                  style={{
                    color: theme.colors.primary,
                    fontFamily: theme.fonts.heading,
                  }}
                >
                  {event.name}
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar
                      size={16}
                      style={{ color: theme.colors.secondary }}
                    />
                    <span
                      className="text-sm"
                      style={{
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Clock
                      size={16}
                      style={{ color: theme.colors.secondary }}
                    />
                    <span
                      className="text-sm"
                      style={{
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      {event.startTime}
                      {event.endTime ? ` - ${event.endTime}` : ' - Selesai'}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <MapPin
                      size={16}
                      style={{ color: theme.colors.secondary }}
                    />
                    <span
                      className="text-sm"
                      style={{
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      {event.venue}
                    </span>
                  </div>

                  <p
                    className="text-xs"
                    style={{
                      color: theme.colors.textMuted,
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    {event.address}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  {event.mapUrl && (
                    <a
                      href={event.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-xs font-medium uppercase tracking-wider transition-colors hover:opacity-80"
                      style={{
                        borderColor: theme.colors.primary,
                        color: theme.colors.primary,
                      }}
                    >
                      <MapPin size={14} />
                      Buka Maps
                    </a>
                  )}
                  {calendarUrl && (
                    <a
                      href={calendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:opacity-90"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Calendar size={14} />
                      Simpan Tanggal
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
