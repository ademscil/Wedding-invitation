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
      // Fallback for older browsers
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
      className="rounded-2xl border p-6 text-center"
      style={{ borderColor: theme.colors.secondary + '40' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <p
        className="mb-1 text-sm font-semibold uppercase tracking-wider"
        style={{
          color: theme.colors.primary,
          fontFamily: theme.fonts.body,
        }}
      >
        {account.bankName}
      </p>

      <p
        className="mb-1 text-2xl font-medium tracking-wider"
        style={{
          color: theme.colors.text,
          fontFamily: theme.fonts.body,
        }}
      >
        {account.accountNumber}
      </p>

      <p
        className="mb-4 text-sm"
        style={{
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.body,
        }}
      >
        a.n. {account.accountHolder}
      </p>

      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-medium uppercase tracking-wider transition-all"
        style={{
          borderColor: copied ? theme.colors.primary : theme.colors.secondary + '60',
          color: copied ? theme.colors.primary : theme.colors.text,
          backgroundColor: copied ? theme.colors.primary + '10' : 'transparent',
        }}
      >
        {copied ? (
          <>
            <Check size={14} />
            Tersalin!
          </>
        ) : (
          <>
            <Copy size={14} />
            Salin
          </>
        )}
      </button>
    </motion.div>
  );
}

export function GiftSection({ invitation, theme }: GiftSectionProps) {
  // Owners can hide this section from the invitation settings.
  const visible = isSectionVisible(parseSettings(invitation.settings), 'showGift');

  const accounts = parseBankAccounts(invitation.bankAccounts);

  if (!visible || accounts.length === 0) return null;

  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <div className="mx-auto max-w-lg">
        <SectionHeading
          title="Amplop Digital"
          theme={theme}
          icon={<Gift size={24} style={{ color: theme.colors.primary }} />}
        />

        <div className="space-y-4">
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
