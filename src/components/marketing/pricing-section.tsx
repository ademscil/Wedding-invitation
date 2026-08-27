'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import { cn } from '@/lib/utils';

function formatPrice(price: number) {
  if (price === 0) return 'Gratis';
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function formatLimit(val: number) {
  return val === -1 ? 'Unlimited' : String(val);
}

type TierKey = keyof typeof SUBSCRIPTION_TIERS;

const tierOrder: TierKey[] = ['FREE', 'STARTER', 'PREMIUM', 'BUSINESS'];

const featureLabels: {
  key: string;
  label: string;
  type: 'number' | 'boolean';
  field: keyof (typeof SUBSCRIPTION_TIERS)['FREE'];
  /** Listed on the roadmap but not shipped yet — never rendered as included. */
  comingSoon?: boolean;
}[] = [
  { key: 'invitations', label: 'Undangan', type: 'number', field: 'maxInvitations' },
  { key: 'guests', label: 'Tamu', type: 'number', field: 'maxGuests' },
  { key: 'gallery', label: 'Foto galeri', type: 'number', field: 'maxGalleryImages' },
  { key: 'love', label: 'Love Story', type: 'boolean', field: 'hasLoveStory' },
  { key: 'music', label: 'Musik Kustom', type: 'boolean', field: 'hasCustomMusic' },
  { key: 'analytics', label: 'Analitik', type: 'boolean', field: 'hasAnalytics' },
  { key: 'broadcast', label: 'Broadcast', type: 'boolean', field: 'hasBroadcast' },
  { key: 'export', label: 'Export Data', type: 'boolean', field: 'hasExport' },
  { key: 'qr', label: 'QR Check-in', type: 'boolean', field: 'hasQrCheckin' },
  { key: 'planner', label: 'Event Planner', type: 'boolean', field: 'hasEventPlanner' },
];

export function PricingSection() {
  return (
    <section id="harga" className="scroll-mt-20 bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary-800 sm:text-4xl">
            Pilih Paket yang Sesuai
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-600">
            Mulai gratis, upgrade kapan saja sesuai kebutuhan pernikahan Anda.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tierOrder.map((key, i) => {
            const tier = SUBSCRIPTION_TIERS[key];
            const isPopular = key === 'PREMIUM';

            return (
              <motion.div
                key={key}
                className={cn(
                  'relative flex flex-col rounded-xl border p-6',
                  isPopular
                    ? 'border-2 border-accent shadow-lg'
                    : 'border-primary-100'
                )}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-0.5 text-xs font-semibold text-white">
                    Populer
                  </span>
                )}

                <h3 className="font-display text-xl font-semibold text-primary-800">
                  {tier.name}
                </h3>

                <div className="mt-4">
                  <span className="text-3xl font-bold text-primary-800">
                    {formatPrice(tier.price)}
                  </span>
                  {tier.price > 0 && (
                    <span className="ml-1 text-sm text-primary-500">
                      / {tier.duration}
                    </span>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {featureLabels.map((feat) => {
                    const val = tier[feat.field];
                    // A not-yet-shipped feature is never shown as included,
                    // whatever the tier config says.
                    const enabled = feat.comingSoon
                      ? false
                      : feat.type === 'boolean'
                        ? val
                        : true;

                    return (
                      <li key={feat.key} className="flex items-start gap-2 text-sm">
                        {enabled ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
                        )}
                        <span
                          className={cn(
                            enabled ? 'text-primary-700' : 'text-primary-400'
                          )}
                        >
                          {feat.type === 'number'
                            ? `${formatLimit(val as number)} ${feat.label}`
                            : feat.label}
                          {feat.comingSoon && (
                            <em className="ml-1 not-italic text-xs text-primary-400">
                              (segera hadir)
                            </em>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <Button
                  className="mt-6 w-full"
                  variant={isPopular ? 'accent' : 'outline'}
                  asChild
                >
                  <Link href="/register">
                    {tier.price === 0 ? 'Mulai Gratis' : 'Pilih Paket'}
                  </Link>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
