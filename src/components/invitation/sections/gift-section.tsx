'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Gift } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import { SectionHeading } from '../motion';
import { parseSettings, isSectionVisible } from '@/lib/invitation-data';
import type { BankAccount } from '@/types';
import { parseBankAccounts } from '@/lib/invitation-data';
import { trackEvent } from '@/lib/public-api';

interface GiftSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

function BankCard({
  account,
  theme,
  index,
  invitationSlug,
}: {
  account: BankAccount;
  theme: TemplateTheme;
  index: number;
  invitationSlug: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    trackEvent(invitationSlug, 'GIFT_CLICK', { bank: account.bankName });
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = account.accountNumber;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-md text-left transition-all"
      style={{
        borderColor: theme.colors.secondary + '40',
        background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.secondary}15 100%)`,
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
    >
      {/* Top row: Chip and Bank Name */}
      <div className="flex items-center justify-between mb-4">
        {/* Sim Chip Icon */}
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-9 rounded-md border flex items-center justify-center shadow-inner"
            style={{
              borderColor: theme.colors.primary + '60',
              backgroundColor: theme.colors.primary + '20',
            }}
          >
            <div
              className="h-4 w-6 border-t border-b grid grid-cols-2 opacity-70"
              style={{ borderColor: theme.colors.primary }}
            />
          </div>
          <span className="text-[10px] tracking-widest uppercase opacity-60" style={{ color: theme.colors.textMuted }}>
            Cashless Gift
          </span>
        </div>

        {/* Bank Name Badge */}
        <span
          className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border shadow-sm"
          style={{
            borderColor: theme.colors.secondary + '60',
            backgroundColor: theme.colors.primary + '15',
            color: theme.colors.primary,
          }}
        >
          {account.bankName}
        </span>
      </div>

      {/* Account Number */}
      <div className="my-3">
        <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1" style={{ color: theme.colors.textMuted }}>
          Nomor Rekening
        </p>
        <p
          className="text-xl sm:text-2xl font-mono font-semibold tracking-wider select-all"
          style={{
            color: theme.colors.text,
            letterSpacing: '0.08em',
          }}
        >
          {account.accountNumber}
        </p>
      </div>

      {/* Bottom row: Account Holder and Copy Button */}
      <div className="mt-4 pt-3 border-t flex items-center justify-between gap-3" style={{ borderColor: theme.colors.secondary + '25' }}>
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-60" style={{ color: theme.colors.textMuted }}>
            Atas Nama
          </p>
          <p
            className="text-xs sm:text-sm font-medium tracking-wide uppercase truncate max-w-[180px] sm:max-w-[220px]"
            style={{ color: theme.colors.text }}
          >
            {account.accountHolder}
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          style={{
            borderColor: copied ? theme.colors.primary : theme.colors.secondary + '70',
            color: copied ? '#ffffff' : theme.colors.text,
            backgroundColor: copied ? theme.colors.primary : theme.colors.secondary + '25',
          }}
        >
          {copied ? (
            <>
              <Check size={13} className="stroke-[2.5]" />
              Tersalin!
            </>
          ) : (
            <>
              <Copy size={13} />
              Salin
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export function GiftSection({ invitation, theme }: GiftSectionProps) {
  const visible = isSectionVisible(parseSettings(invitation.settings), 'showGift');
  const accounts = parseBankAccounts(invitation.bankAccounts);

  if (!visible || accounts.length === 0) return null;

  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <div className="mx-auto max-w-lg">
        <SectionHeading
          title="Amplop Digital"
          subtitle="Doa restu Anda adalah karunia terindah, namun jika ingin memberikan tanda kasih, Anda dapat mengirimkannya melalui:"
          theme={theme}
          icon={<Gift size={24} style={{ color: theme.colors.primary }} />}
        />

        <div className="mt-8 space-y-4">
          {accounts.map((account, index) => (
            <BankCard
              key={account.id}
              account={account}
              theme={theme}
              index={index}
              invitationSlug={invitation.slug}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
