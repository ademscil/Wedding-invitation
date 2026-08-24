import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description:
    'Bagaimana WedInvite mengumpulkan, menggunakan, dan melindungi data Anda dan data tamu undangan.',
};

/**
 * Privacy policy.
 *
 * Beyond being a gateway requirement, this product stores guest lists — other
 * people's names and phone numbers, collected by the customer rather than by
 * us. Saying plainly who holds what, and for how long, is the minimum owed to
 * everyone in that list.
 */
export default function PrivacyPage() {
  const updated = '23 Agustus 2026';

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl sm:text-4xl">Kebijakan Privasi</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Terakhir diperbarui: {updated}
      </p>

      <div className="mt-10 max-w-none space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">1. Data yang Kami Kumpulkan</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Data akun:</strong> nama, alamat email, nomor telepon, dan
              password yang disimpan dalam bentuk terenkripsi satu arah (hash).
            </li>
            <li>
              <strong>Data undangan:</strong> nama mempelai, tanggal dan lokasi acara,
              foto, serta informasi lain yang Anda isi sendiri.
            </li>
            <li>
              <strong>Data tamu:</strong> nama, nomor telepon, dan email tamu yang{' '}
              <em>Anda</em> masukkan, beserta status kehadiran dan ucapan mereka.
            </li>
            <li>
              <strong>Data kunjungan:</strong> waktu akses, jenis perangkat, dan
              sumber kunjungan undangan, untuk menampilkan statistik kepada Anda.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Data Tamu Adalah Tanggung Jawab Anda</h2>
          <p className="mt-2 text-muted-foreground">
            Untuk daftar tamu, Anda adalah pihak yang menentukan data apa yang
            dikumpulkan; kami hanya menyimpannya atas nama Anda. Pastikan Anda
            memiliki dasar yang wajar untuk menyimpan nomor telepon dan email tamu,
            dan gunakan hanya untuk keperluan undangan Anda.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Penggunaan Data</h2>
          <p className="mt-2 text-muted-foreground">
            Data digunakan untuk menjalankan layanan: menampilkan undangan, mencatat
            RSVP, mengirim notifikasi yang Anda aktifkan, memproses pembayaran, dan
            menyediakan statistik. Kami <strong>tidak</strong> menjual data Anda
            maupun data tamu Anda kepada pihak mana pun.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Pihak Ketiga</h2>
          <p className="mt-2 text-muted-foreground">
            Kami menggunakan penyedia layanan berikut, yang hanya menerima data
            seperlunya untuk menjalankan fungsinya:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Penyedia hosting dan basis data untuk menyimpan data layanan.</li>
            <li>
              Penyedia pembayaran untuk memproses transaksi. Data kartu diproses
              langsung oleh mereka dan tidak pernah menyentuh server kami.
            </li>
            <li>Penyedia pengiriman email untuk notifikasi dan verifikasi akun.</li>
            <li>
              Penyedia penyimpanan berkas untuk foto dan musik yang Anda unggah.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Penyimpanan &amp; Penghapusan</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Data undangan dan tamu disimpan selama akun Anda aktif.
            </li>
            <li>
              Menghapus sebuah undangan akan menghapus seluruh data tamu, ucapan, dan
              statistik yang terkait secara permanen.
            </li>
            <li>
              Anda dapat meminta penghapusan seluruh akun beserta datanya dengan
              menghubungi kami. Permintaan diproses dalam 30 hari.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Keamanan</h2>
          <p className="mt-2 text-muted-foreground">
            Password disimpan sebagai hash dan tidak dapat dibaca kembali, termasuk
            oleh kami. Koneksi ke layanan dienkripsi (HTTPS). Meski demikian, tidak
            ada sistem yang sepenuhnya kebal — gunakan password yang kuat dan unik.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Hak Anda</h2>
          <p className="mt-2 text-muted-foreground">
            Anda berhak mengakses, memperbaiki, mengunduh, dan menghapus data Anda.
            Sebagian besar dapat dilakukan sendiri melalui dashboard; sisanya dapat
            diminta melalui kontak di bawah.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Cookie</h2>
          <p className="mt-2 text-muted-foreground">
            Kami menggunakan cookie yang diperlukan untuk menjaga sesi login Anda
            tetap aktif. Kami tidak menggunakan cookie iklan maupun pelacak pihak
            ketiga.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Kontak</h2>
          <p className="mt-2 text-muted-foreground">
            Pertanyaan atau permintaan terkait data dapat dikirim ke{' '}
            {siteConfig.supportEmail ? (
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="text-primary hover:underline"
              >
                {siteConfig.supportEmail}
              </a>
            ) : (
              <span>alamat dukungan kami</span>
            )}
            .
          </p>
        </section>
      </div>
    </main>
  );
}
