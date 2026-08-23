import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Outbound email.
 *
 * Two backends, because the choice is forced by whether the operator owns a
 * domain yet:
 *
 * - Resend needs a verified domain. Its sandbox sender only delivers to the
 *   account owner's own address, so password resets never reach a customer.
 * - SMTP works with providers that verify a single sender address (Brevo,
 *   Mailjet) or with a Gmail app password, neither of which needs a domain.
 *
 * SMTP is preferred when configured so an operator without a domain still has
 * a working account-recovery path.
 */

/*
 * Every environment read happens inside a function. Reading at module load
 * bakes in whatever was set when the module was first imported, which hides
 * configuration changes from tests and from any runtime that populates the
 * environment lazily.
 */
function fromAddress(): string {
  return (
    process.env.EMAIL_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    'WedInvite <onboarding@resend.dev>'
  );
}

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  );
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT ?? 587);

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

export type SendEmailResult =
  | { sent: true; via: 'smtp' | 'resend' }
  | { sent: false; reason: 'not-configured' | 'failed'; error?: unknown };

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  if (smtpConfigured()) {
    try {
      await getTransporter().sendMail({
        from: fromAddress(),
        to: params.to,
        subject: sanitizeSubject(params.subject),
        html: params.html,
      });
      return { sent: true, via: 'smtp' };
    } catch (error) {
      console.error('[email] SMTP send failed:', error);
      return { sent: false, reason: 'failed', error };
    }
  }

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: fromAddress(),
        to: params.to,
        subject: sanitizeSubject(params.subject),
        html: params.html,
      });
      return { sent: true, via: 'resend' };
    } catch (error) {
      console.error('[email] Resend send failed:', error);
      return { sent: false, reason: 'failed', error };
    }
  }

  // Nothing configured. Say so loudly: account recovery silently doing nothing
  // is worse than the app refusing to pretend it sent something.
  console.warn(
    `[email] No email backend configured — "${params.subject}" was not sent to ${params.to}. ` +
      'Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD, or RESEND_API_KEY with a verified domain.'
  );
  return { sent: false, reason: 'not-configured' };
}

/** Whether any backend is available, so callers can warn before promising delivery. */
export function isEmailConfigured(): boolean {
  return smtpConfigured() || Boolean(process.env.RESEND_API_KEY);
}

/**
 * Escapes a value before it is interpolated into an email body.
 *
 * Guest names and messages arrive from the public invitation page, which
 * anyone holding the link can post to. Interpolated raw, a name like
 * `<a href="...">Klik di sini</a>` renders as a working link in the couple's
 * inbox — a phishing message delivered by their own wedding service.
 */
export function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strips CR/LF from a subject line. A newline there can start a second header,
 * which is how a Bcc gets added to someone else's notification.
 */
export function sanitizeSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
}

export function rsvpNotificationEmail(params: {
  brideName: string;
  groomName: string;
  guestName: string;
  status: string;
  guestCount: number;
}) {
  const statusLabel =
    params.status === 'ATTENDING'
      ? 'akan hadir'
      : params.status === 'NOT_ATTENDING'
        ? 'tidak dapat hadir'
        : 'mungkin hadir';

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>RSVP Baru dari ${escapeHtml(params.guestName)}</h2>
      <p><strong>${escapeHtml(params.guestName)}</strong> mengonfirmasi <strong>${statusLabel}</strong> di undangan ${escapeHtml(params.groomName)} &amp; ${escapeHtml(params.brideName)}.</p>
      <p>Jumlah tamu: ${escapeHtml(params.guestCount)}</p>
    </div>
  `;
}

export function wishNotificationEmail(params: {
  brideName: string;
  groomName: string;
  guestName: string;
  message: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Ucapan Baru dari ${escapeHtml(params.guestName)}</h2>
      <p>"${escapeHtml(params.message)}"</p>
      <p>— untuk undangan ${escapeHtml(params.groomName)} &amp; ${escapeHtml(params.brideName)}</p>
    </div>
  `;
}

export function verificationEmail(params: { name: string; url: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Verifikasi Email Anda</h2>
      <p>Halo ${escapeHtml(params.name)},</p>
      <p>Klik tombol di bawah untuk memverifikasi alamat email Anda di WedInvite.</p>
      <p style="margin: 24px 0;">
        <a href="${escapeHtml(params.url)}"
           style="background:#8B2332;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Verifikasi Email
        </a>
      </p>
      <p style="color:#666;font-size:13px;">
        Tautan ini berlaku 24 jam. Jika Anda tidak membuat akun, abaikan email ini.
      </p>
      <p style="color:#999;font-size:12px;word-break:break-all;">${escapeHtml(params.url)}</p>
    </div>
  `;
}

export function passwordResetEmail(params: { name: string; url: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Atur Ulang Password</h2>
      <p>Halo ${escapeHtml(params.name)},</p>
      <p>Kami menerima permintaan untuk mengatur ulang password akun WedInvite Anda.</p>
      <p style="margin: 24px 0;">
        <a href="${escapeHtml(params.url)}"
           style="background:#8B2332;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Atur Ulang Password
        </a>
      </p>
      <p style="color:#666;font-size:13px;">
        Tautan ini hanya berlaku <strong>1 jam</strong> dan hanya bisa dipakai sekali.
        Jika Anda tidak meminta ini, abaikan email ini — password Anda tidak berubah.
      </p>
      <p style="color:#999;font-size:12px;word-break:break-all;">${escapeHtml(params.url)}</p>
    </div>
  `;
}
