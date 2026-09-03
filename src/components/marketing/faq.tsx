'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
const faqItems = [
  {
    question: 'Apakah WedInvite benar-benar gratis?',
    answer:
      'Ya! Paket Gratis kami memungkinkan Anda membuat 1 undangan digital dengan hingga 50 tamu. Untuk fitur lebih lengkap, Anda bisa upgrade ke paket berbayar mulai dari Rp 49.000 kapan saja.',
  },
  {
    question: 'Apa keunggulan paket Starter Rp 49.000 dibandingkan kompetitor?',
    answer:
      'Di WedInvite, paket Starter (Rp 49.000 sekali bayar) sudah langsung menyertakan 15 foto galeri prewedding, musik latar kustom, RSVP instan, amplop digital cashless, dan love story. Anda tidak perlu membayar mahal atau terjebak paket murah yang membatasi foto dan musik.',
  },
  {
    question: 'Bagaimana cara kerja fitur QR Code Check-in tamu?',
    answer:
      'Setiap tamu memiliki QR Code unik pada undangan digital mereka. Pada hari-H pernikahan, penerima tamu cukup memindai QR Code tersebut langsung dari kamera HP tanpa alat scanner khusus, lengkap dengan informasi nomor meja dan status kehadiran.',
  },
  {
    question: 'Bagaimana cara membagikan undangan ke tamu?',
    answer:
      'Setelah undangan selesai, Anda akan mendapatkan tautan unik yang bisa dibagikan melalui WhatsApp, Instagram, email, atau media sosial lainnya. Fitur WhatsApp broadcast kami memungkinkan Anda menyapa tamu dengan nama personal secara otomatis.',
  },
  {
    question: 'Apakah saya bisa mengubah desain dan data setelah dipublikasikan?',
    answer:
      'Tentu saja! Anda bisa mengedit konten, foto, dan detail acara kapan saja tanpa batas. Perubahan akan langsung terupdate secara real-time saat tamu membuka tautan undangan Anda.',
  },
  {
    question: 'Bagaimana cara kerja fitur RSVP dan Ucapan?',
    answer:
      'Tamu Anda bisa mengonfirmasi kehadiran serta mengirimkan doa restu langsung di undangan digital. Anda dapat memantau rekap data kehadiran secara real-time di dashboard untuk menghitung porsi katering dengan akurat.',
  },
  {
    question: 'Apakah amplop digital aman?',
    answer:
      'Sangat aman. Amplop digital dan fitur kado pernikahan terhubung langsung ke rekening bank atau dompet digital (e-wallet) pribadi Anda tanpa perantara pihak ketiga.',
  },
  {
    question: 'Berapa lama undangan aktif?',
    answer:
      'Masa aktif disesuaikan dengan kebutuhan Anda: 3 bulan untuk Gratis, 6 bulan untuk Starter (Rp 49rb), 12 bulan untuk Premium (Rp 99rb), dan hingga 2 tahun untuk paket Business.',
  },
  {
    question: 'Apakah undangan bisa dibuka lancar di semua perangkat HP?',
    answer:
      'Ya, seluruh template WedInvite dirancang mobile-first, sangat ringan, dan responsif untuk semua merk smartphone Android, iPhone, tablet, hingga laptop.',
  },
];

export function FAQ() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section id="faq" className="scroll-mt-20 bg-white px-4 py-20 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary-800 sm:text-4xl">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-600">
            Temukan jawaban untuk pertanyaan umum tentang pembuatan undangan pernikahan digital di WedInvite.
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
