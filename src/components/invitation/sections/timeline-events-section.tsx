'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MapPin, Clock } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import type { InvitationEvent } from '@/types';

interface TimelineEventsSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
  title?: string;
  subtitle?: string;
}

function parseEvents(eventsJson: string): InvitationEvent[] {
  try {
    return JSON.parse(eventsJson) as InvitationEvent[];
  } catch {
    return [];
  }
}

function generateCalendarUrl(event: InvitationEvent): string {
  const startDate = event.date.replace(/-/g, '');
  const startTime = event.startTime.replace(/:/g, '') + '00';
  const endTime = event.endTime
    ? event.endTime.replace(/:/g, '') + '00'
    : startTime;

  const title = encodeURIComponent(event.name);
  const location = encodeURIComponent(`${event.venue}, ${event.address}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}T${startTime}/${startDate}T${endTime}&location=${location}`;
}

// Vertical connecting-line timeline layout (akad/resepsi style), unlike the card-grid EventsSection
export function TimelineEventsSection({
  invitation,
  theme,
  title = 'Acara Pernikahan',
  subtitle = 'Rangkaian acara yang akan diselenggarakan',
}: TimelineEventsSectionProps) {
  const events = parseEvents(invitation.events);

  if (events.length === 0) return null;

  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <div className="mx-auto max-w-xl">
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="mb-2 text-3xl sm:text-4xl"
            style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
          >
            {title}
          </h2>
          <p
            className="text-sm tracking-widest"
            style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
          >
            {subtitle}
          </p>
        </motion.div>

        <div className="relative">
          {events.length > 1 && (
            <div
              className="absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2"
              style={{ backgroundColor: theme.colors.secondary + '80' }}
            />
          )}

          <div className="space-y-16">
            {events.map((event, index) => {
              let formattedDate = event.date;
              try {
                formattedDate = format(new Date(event.date), 'EEEE, d MMMM yyyy', {
                  locale: id,
                });
              } catch {
                // use raw date string
              }

              return (
                <motion.div
                  key={event.id}
                  className="relative flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div
                    className="relative z-10 mb-4 h-4 w-4 rounded-full border-2"
                    style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.background }}
                  />

                  <h3
                    className="mb-2 text-2xl"
                    style={{ color: theme.colors.primary, fontFamily: theme.fonts.script }}
                  >
                    {event.name}
                  </h3>

                  <p className="mb-1 text-sm" style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}>
                    {formattedDate}
                  </p>

                  <p
                    className="mb-3 flex items-center gap-1 text-sm"
                    style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
                  >
                    <Clock size={14} />
                    {event.startTime}
                    {event.endTime ? ` - ${event.endTime}` : ' - Selesai'}
                  </p>

                  <div
                    className="mb-1 flex items-center justify-center gap-1 text-sm font-medium"
                    style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}
                  >
                    <MapPin size={14} style={{ color: theme.colors.secondary }} />
                    {event.venue}
                  </div>

                  <p
                    className="mb-4 max-w-xs text-xs"
                    style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
                  >
                    {event.address}
                  </p>

                  <a
                    href={generateCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider transition-colors hover:text-white"
                    style={{ borderColor: theme.colors.secondary, color: theme.colors.primary }}
                  >
                    + Tambah ke Kalender
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
