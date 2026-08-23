'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, MapPin, Clock } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import type { InvitationEvent } from '@/types';
import { parseEvents, buildCalendarUrl } from '@/lib/invitation-data';

interface EventsSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

function generateCalendarUrl(event: InvitationEvent, coupleNames: string): string | null {
  return buildCalendarUrl(event, coupleNames);
}

export function EventsSection({ invitation, theme }: EventsSectionProps) {
  const events = parseEvents(invitation.events);
  const coupleNames = `${invitation.brideName} & ${invitation.groomName}`;

  if (events.length === 0) return null;

  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <div className="mx-auto max-w-3xl">
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
            Acara Pernikahan
          </h2>
          <p
            className="text-sm tracking-widest"
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
            }}
          >
            Rangkaian acara yang akan diselenggarakan
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {events.map((event, index) => {
            const parsedDate = event.date ? new Date(event.date) : null;
            const formattedDate =
              parsedDate && !Number.isNaN(parsedDate.getTime())
                ? format(parsedDate, 'EEEE, d MMMM yyyy', { locale: id })
                : event.date;
            const calendarUrl = generateCalendarUrl(event, coupleNames);

            return (
              <motion.div
                key={event.id}
                className="rounded-2xl border p-6 text-center"
                style={{
                  borderColor: theme.colors.secondary + '40',
                  backgroundColor: theme.colors.background,
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
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
