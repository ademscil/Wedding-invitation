import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description:
    'Syarat dan ketentuan penggunaan layanan undangan pernikahan digital WedInvite.',
};

/**
 * Terms of service.
 *
 * Payment gateways require published terms and a privacy policy before they
 * will approve a merchant account, and taking money without them is not
 * something to defer.
 *
 * The placeholders marked below must be filled in with the operator's real
 * legal details before going live.
 */
export default function TermsPage() {
  const updated = '23 Agustus 2026';

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl sm:text-4xl">Syarat &amp; Ketentuan</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Terakhir diperbarui: {updated}
      </p>

      <div className="prose prose-neutral mt-10 max-w-none space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">1. Penerimaan Ketentuan</h2>
          <p className="mt-2 text-muted-foreground">
            Dengan membuat akun atau menggunakan layanan {siteConfig.name}, Anda
            menyatakan telah membaca, memahami, dan menyetujui syarat dan ketentuan
            ini. Jika Anda tidak menyetujuinya, mohon tidak menggunakan layanan kami.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Layanan</h2>
          <p className="mt-2 text-muted-foreground">
            {siteConfig.name} menyediakan platform untuk membuat, mengelola, dan
            membagikan undangan pernikahan digital, termasuk pengelolaan daftar tamu,
            konfirmasi kehadiran (RSVP), buku tamu, dan fitur lain sesuai paket
            langganan yang Anda pilih.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Akun Pengguna</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Anda bertanggung jawab menjaga kerahasiaan password akun Anda.</li>
            <li>
              Anda bertanggung jawab atas seluruh aktivitas yang terjadi melalui akun
              Anda.
            </li>
            <li>
              Data yang Anda masukkan harus benar dan tidak melanggar hak pihak lain.
            </li>
            <li>
              Segera hubungi kami jika Anda menduga akun Anda diakses pihak lain.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Paket Langganan &amp; Pembayaran</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Harga setiap paket ditampilkan pada halaman Harga dan sudah termasuk
              pajak yang berlaku, kecuali dinyatakan lain.
            </li>
            <li>
              Pembayaran diproses melalui penyedia pembayaran pihak ketiga. Kami tidak
              menyimpan data kartu atau kredensial pembayaran Anda.
            </li>
            <li>
              Paket berlaku selama jangka waktu yang tertera pada paket, terhitung
              sejak pembayaran berhasil dikonfirmasi.
            </li>
            <li>
              Setelah masa aktif berakhir, undangan yang sudah tayang tidak lagi dapat
              diakses publik sampai paket diperpanjang.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Pengembalian Dana</h2>
          <p className="mt-2 text-muted-foreground">
            Permintaan pengembalian dana dapat diajukan dalam <strong>7 hari</strong>{' '}
            sejak pembayaran, selama undangan belum ditayangkan dan belum dibagikan
            kepada tamu. Setelah undangan ditayangkan, layanan dianggap telah
            digunakan dan pembayaran tidak dapat dikembalikan. Ajukan permintaan
            melalui kontak pada bagian 10.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Konten Anda</h2>
          <p className="mt-2 text-muted-foreground">
            Foto, teks, musik, dan data tamu yang Anda unggah tetap menjadi milik
            Anda. Anda memberi kami izin terbatas untuk menyimpan dan menampilkannya
            semata-mata untuk menjalankan layanan. Anda menjamin memiliki hak atas
            konten yang diunggah, termasuk hak atas musik dan foto.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Larangan</h2>
          <p className="mt-2 text-muted-foreground">
            Anda dilarang menggunakan layanan untuk menyebarkan konten yang melanggar
            hukum, menyinggung SARA, bersifat pornografi, menipu, melanggar hak cipta,
            atau mengirim pesan massal yang tidak diminta. Kami berhak menonaktifkan
            akun yang melanggar tanpa pengembalian dana.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Ketersediaan Layanan</h2>
          <p className="mt-2 text-muted-foreground">
            Kami berupaya menjaga layanan tetap tersedia, namun tidak menjamin bebas
            gangguan. Pemeliharaan terjadwal akan diinformasikan sebelumnya bila
            memungkinkan.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Batasan Tanggung Jawab</h2>
          <p className="mt-2 text-muted-foreground">
            Tanggung jawab kami atas kerugian yang timbul dari penggunaan layanan
            dibatasi maksimal sebesar biaya yang Anda bayarkan dalam 12 bulan
            terakhir. Kami tidak bertanggung jawab atas kerugian tidak langsung.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Kontak</h2>
          <p className="mt-2 text-muted-foreground">
            Pertanyaan mengenai ketentuan ini dapat dikirim ke{' '}
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

        <section>
          <h2 className="text-lg font-semibold">11. Hukum yang Berlaku</h2>
          <p className="mt-2 text-muted-foreground">
            Syarat dan ketentuan ini tunduk pada hukum Republik Indonesia.
          </p>
        </section>
      </div>
    </main>
  );
}
