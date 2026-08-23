import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Which backend a send goes through decides whether account recovery works at
 * all: Resend's sandbox sender only delivers to the operator's own inbox, so an
 * operator without a domain must be able to fall back to plain SMTP.
 */

const sendMail = vi.fn();
const resendSend = vi.fn();

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

vi.mock('resend', () => ({
  // A class, not an arrow: the module constructs this with `new`.
  Resend: class {
    emails = { send: resendSend };
  },
}));

const ENV_KEYS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'RESEND_FROM_EMAIL',
] as const;

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.resetModules();
  sendMail.mockReset().mockResolvedValue({ messageId: 'x' });
  resendSend.mockReset().mockResolvedValue({ data: { id: 'y' } });
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function setSmtp() {
  process.env.SMTP_HOST = 'smtp-relay.example';
  process.env.SMTP_USER = 'user@example.com';
  process.env.SMTP_PASSWORD = 'secret';
}

const message = { to: 'guest@example.com', subject: 'Halo', html: '<p>Hi</p>' };

describe('sendEmail backend selection', () => {
  it('reports nothing sent when no backend is configured', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { sendEmail, isEmailConfigured } = await import('@/lib/email');

    expect(isEmailConfigured()).toBe(false);
    await expect(sendEmail(message)).resolves.toEqual({
      sent: false,
      reason: 'not-configured',
    });

    // Silence here would mean password resets vanish with no trace in the logs.
    expect(warn).toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
    expect(resendSend).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('uses SMTP when it is configured', async () => {
    setSmtp();
    const { sendEmail, isEmailConfigured } = await import('@/lib/email');

    expect(isEmailConfigured()).toBe(true);
    await expect(sendEmail(message)).resolves.toEqual({ sent: true, via: 'smtp' });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: message.to, subject: message.subject })
    );
  });

  it('prefers SMTP over Resend when both are configured', async () => {
    setSmtp();
    process.env.RESEND_API_KEY = 're_test';
    const { sendEmail } = await import('@/lib/email');

    await expect(sendEmail(message)).resolves.toEqual({ sent: true, via: 'smtp' });
    expect(resendSend).not.toHaveBeenCalled();
  });

  it('falls back to Resend when only Resend is configured', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const { sendEmail, isEmailConfigured } = await import('@/lib/email');

    expect(isEmailConfigured()).toBe(true);
    await expect(sendEmail(message)).resolves.toEqual({ sent: true, via: 'resend' });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('reports a failure instead of throwing at the caller', async () => {
    setSmtp();
    sendMail.mockRejectedValueOnce(new Error('relay refused'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { sendEmail } = await import('@/lib/email');

    const result = await sendEmail(message);
    expect(result.sent).toBe(false);
    expect(result).toMatchObject({ reason: 'failed' });
    error.mockRestore();
  });

  it('honours EMAIL_FROM over the Resend sandbox default', async () => {
    setSmtp();
    process.env.EMAIL_FROM = 'WedInvite <halo@wedinvite.id>';
    const { sendEmail } = await import('@/lib/email');

    await sendEmail(message);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'WedInvite <halo@wedinvite.id>' })
    );
  });
});
