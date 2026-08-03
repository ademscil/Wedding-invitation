import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'WedInvite <onboarding@resend.dev>';

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    // Resend not configured — skip silently so the app keeps working without it.
    console.warn('[email] RESEND_API_KEY not set, skipping email to', params.to);
    return { skipped: true };
  }

  try {
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (error) {
    console.error('[email] Failed to send email:', error);
    return { skipped: true, error };
  }
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
      <h2>RSVP Baru dari ${params.guestName}</h2>
      <p><strong>${params.guestName}</strong> mengonfirmasi <strong>${statusLabel}</strong> di undangan ${params.brideName} &amp; ${params.groomName}.</p>
      <p>Jumlah tamu: ${params.guestCount}</p>
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
      <h2>Ucapan Baru dari ${params.guestName}</h2>
      <p>"${params.message}"</p>
      <p>— untuk undangan ${params.brideName} &amp; ${params.groomName}</p>
    </div>
  `;
}
