'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
const faqItems = [
  {
    question: 'Apakah WedInvite benar-benar gratis?',
    answer:
      'Ya! Paket Gratis kami memungkinkan Anda membuat 1 undangan digital dengan hingga 50 tamu. Untuk fitur lebih lengkap, Anda bisa upgrade ke paket berbayar kapan saja.',
  },
  {
    question: 'Bagaimana cara membagikan undangan ke tamu?',
    answer:
      'Setelah undangan selesai, Anda akan mendapatkan tautan unik yang bisa dibagikan melalui WhatsApp, Instagram, email, atau media sosial lainnya. Setiap tamu juga bisa mendapat tautan personal.',
  },
  {
    question: 'Apakah saya bisa mengubah desain setelah dipublikasikan?',
    answer:
      'Tentu saja! Anda bisa mengedit konten, foto, dan detail acara kapan saja. Perubahan akan langsung terlihat oleh tamu yang membuka tautan undangan Anda.',
  },
  {
    question: 'Bagaimana cara kerja fitur RSVP?',
    answer:
      'Tamu Anda bisa mengkonfirmasi kehadiran langsung di undangan digital. Anda bisa memantau status RSVP secara real-time melalui dashboard, termasuk jumlah tamu yang hadir, tidak hadir, dan belum merespons.',
  },
  {
    question: 'Apakah amplop digital aman?',
    answer:
      'Ya, amplop digital kami terhubung langsung ke rekening bank Anda. Kami tidak menyimpan data perbankan dan semua transfer dilakukan langsung antar bank.',
  },
  {
    question: 'Berapa lama undangan aktif?',
    answer:
      'Masa aktif tergantung paket yang dipilih: 3 bulan untuk Gratis, 6 bulan untuk Starter, 12 bulan untuk Premium, dan 2 tahun untuk Business.',
  },
  {
    question: 'Apakah undangan bisa diakses di semua perangkat?',
    answer:
      'Ya, semua template kami responsif dan bisa diakses dengan baik di smartphone, tablet, maupun komputer desktop.',
  },
  {
    question: 'Bagaimana jika saya butuh bantuan?',
    answer:
      'Tim dukungan kami siap membantu melalui chat dan email. Pengguna paket Premium dan Business juga mendapat dukungan prioritas.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary-800 sm:text-4xl">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-600">
            Temukan jawaban untuk pertanyaan umum tentang WedInvite.
          </p>
        </div>

        <Accordion.Root type="single" collapsible className="mt-12 space-y-3">
          {faqItems.map((item, i) => (
            <Accordion.Item
              key={i}
              value={`item-${i}`}
              className="rounded-lg border border-primary-100 bg-primary-50/30"
            >
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-primary-800 hover:text-primary transition-colors">
                  {item.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-primary-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <p className="px-5 pb-4 text-sm leading-relaxed text-primary-600">
                  {item.answer}
                </p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
