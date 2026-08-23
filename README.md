# WedInvite

Platform SaaS undangan pernikahan digital untuk pasar Indonesia. Dibangun dengan
Next.js 14 (App Router), TypeScript, Prisma, tRPC, dan Tailwind CSS.

---

## Menjalankan di Lokal

Prasyarat: Node.js 18.18+ dan npm.

```bash
# 1. Install dependensi
npm install

# 2. Siapkan environment
cp .env.example .env.local
```

Buka `.env.local` dan isi **satu nilai wajib**:

```bash
# Generate dengan: openssl rand -base64 32
NEXTAUTH_SECRET="hasil-generate-di-sini"
```

Semua nilai lain sudah punya default yang bekerja untuk pengembangan lokal.

```bash
# 3. Buat database dan isi data awal
npx prisma db push
npm run db:seed

# 4. Jalankan
npm run dev
```

Buka http://localhost:3000

### Akun admin

`npm run db:seed` membuat satu akun admin:

| Email | Password |
| --- | --- |
| `admin@wedinvite.local` | `admin12345` |

Login lalu buka `/admin`. Ubah kredensial ini lewat `SEED_ADMIN_EMAIL` dan
`SEED_ADMIN_PASSWORD` sebelum seed, dan ganti passwordnya setelah login pertama.

### Mode demo pembayaran

`PAYMENT_DEMO_MODE="true"` (default di `.env.example`) membuat tombol upgrade
langsung mengaktifkan paket tanpa gateway pembayaran, sehingga fitur berbayar
bisa dicoba lokal. Mode ini **ditolak otomatis** saat `NODE_ENV=production`
atau `MIDTRANS_IS_PRODUCTION=true`, jadi tidak bisa aktif di deployment live.

---

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm run type-check` | Pengecekan tipe TypeScript |
| `npm run test` | Unit test (Vitest) |
| `npm run db:push` | Terapkan skema ke database |
| `npm run db:seed` | Isi template + akun admin |
| `npm run db:studio` | Prisma Studio |

---

## Struktur

```
src/
  app/
    (marketing)/      Landing, harga
    (auth)/           Login, register
    (dashboard)/      Area pengguna
    (admin)/          Back-office admin
    (invitation)/
      [slug]/                    Halaman undangan publik
      [slug]/to/[guestSlug]/     Link personal per tamu
    api/
      trpc/[trpc]/    Endpoint tRPC
      webhooks/payment/          Notifikasi Midtrans
  components/
    ui/               Komponen dasar
    invitation/sections/         Bagian undangan (cover, RSVP, galeri, dll)
    dashboard/        Komponen dashboard
  server/
    trpc.ts           Setup tRPC + helper otorisasi
    routers/          Router per domain
  templates/          10 template undangan
  lib/
    subscription.ts   Feature gating per paket
    invitation-data.ts Parser kolom JSON undangan
    payment.ts        Integrasi Midtrans
    guest-utils.ts    Import/export tamu, QR, WhatsApp
prisma/
  schema.prisma       Skema database
  seed.ts             Data awal
```

---

## Cara Kerja

### Undangan

Data yang bentuknya bervariasi (acara, rekening, galeri, love story, pengaturan)
disimpan sebagai kolom JSON di tabel `Invitation`. Semua pembacaan melewati
`src/lib/invitation-data.ts`, yang menormalkan bentuk lama maupun baru sehingga
undangan yang dibuat sebelum perubahan skema tetap tampil benar.

### Link personal tamu

Setiap tamu punya `personalLink` unik. URL-nya:

```
https://domain.com/{slug-undangan}/to/{personalLink}
```

Membuka link ini menyapa tamu dengan namanya, mencatat waktu buka pertama, dan
mengaitkan RSVP ke record tamu tersebut. Bentuk lama `?to={personalLink}` masih
didukung. QR code, tombol WhatsApp, dan salin-link semuanya memakai URL yang
sama lewat `buildGuestUrl()`.

### Paket langganan

Batas per paket didefinisikan di `src/lib/constants.ts` dan **ditegakkan di
server** melalui `src/lib/subscription.ts` — `assertQuota()` untuk batas jumlah
dan `assertFeature()` untuk fitur. Tier selalu dibaca dari database, tidak dari
JWT, sehingga perubahan paket langsung berlaku.

### Pembayaran

Alur upgrade memakai Midtrans Snap. Status pembayaran tidak pernah dipercaya
dari klien: `confirmPayment` memverifikasi ulang ke API Midtrans, dan webhook
memvalidasi signature SHA512 serta mencocokkan nominal sebelum mengaktifkan
paket. Paket ditentukan dari nominal yang tercatat, bukan dari input pemanggil.

---

## Deployment Produksi

1. **Database** — ganti provider di `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```

   Lalu set `DATABASE_URL` ke connection string PostgreSQL.

2. **Environment** — set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, dan
   `NEXT_PUBLIC_APP_URL` ke domain produksi. Pastikan `PAYMENT_DEMO_MODE`
   tidak diset ke `true`.

3. **Midtrans** — isi `MIDTRANS_SERVER_KEY`,
   `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, dan set `MIDTRANS_IS_PRODUCTION="true"`.
   Arahkan *Payment Notification URL* di dashboard Midtrans ke:

   ```
   https://domain-anda.com/api/webhooks/payment
   ```

4. **Google OAuth** (opsional) — isi `GOOGLE_CLIENT_ID` dan
   `GOOGLE_CLIENT_SECRET`, dan daftarkan redirect URI
   `https://domain-anda.com/api/auth/callback/google`.

---

## Yang Belum Terpasang

Fitur berikut punya slot konfigurasi tapi belum terhubung ke layanan:

- **Upload file** — galeri dan foto mempelai diisi dengan URL. Integrasi
  UploadThing (`UPLOADTHING_SECRET`) belum dipasang.
- **Email transaksional** — `RESEND_API_KEY` belum dipakai; verifikasi email
  dan reset password belum tersedia.
- **Custom domain** — ada di daftar fitur paket dan kolom database, tapi
  routing domain kustom belum diimplementasikan.
- **Thumbnail template** — `/public/templates/*.jpg` belum ada, sehingga kartu
  template menampilkan placeholder.
