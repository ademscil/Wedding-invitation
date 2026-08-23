import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  isPaidStatus,
  isFailedStatus,
  verifyWebhookSignature,
  isDemoPaymentMode,
  isMidtransConfigured,
} from '@/lib/payment';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllEnvs();
});

describe('isPaidStatus', () => {
  it('accepts a settled transaction', () => {
    expect(isPaidStatus({ transactionStatus: 'settlement' })).toBe(true);
  });

  it('accepts a capture only when fraud review passed', () => {
    expect(isPaidStatus({ transactionStatus: 'capture', fraudStatus: 'accept' })).toBe(true);
    expect(isPaidStatus({ transactionStatus: 'capture', fraudStatus: 'challenge' })).toBe(false);
    expect(isPaidStatus({ transactionStatus: 'capture' })).toBe(false);
  });

  it('rejects pending and failed states', () => {
    expect(isPaidStatus({ transactionStatus: 'pending' })).toBe(false);
    expect(isPaidStatus({ transactionStatus: 'deny' })).toBe(false);
  });
});

describe('isFailedStatus', () => {
  it('recognises terminal failures', () => {
    for (const status of ['cancel', 'deny', 'expire', 'failure']) {
      expect(isFailedStatus(status)).toBe(true);
    }
  });

  it('does not treat pending or settlement as failed', () => {
    expect(isFailedStatus('pending')).toBe(false);
    expect(isFailedStatus('settlement')).toBe(false);
  });
});

describe('verifyWebhookSignature', () => {
  const serverKey = 'SB-Mid-server-TESTKEY';
  const payload = {
    order_id: 'WI-123',
    status_code: '200',
    gross_amount: '199000.00',
  };

  const validSignature = crypto
    .createHash('sha512')
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest('hex');

  beforeEach(() => {
    vi.stubEnv('MIDTRANS_SERVER_KEY', serverKey);
  });

  it('accepts a correctly signed payload', () => {
    expect(verifyWebhookSignature({ ...payload, signature_key: validSignature })).toBe(true);
  });

  it('rejects a tampered amount', () => {
    expect(
      verifyWebhookSignature({
        ...payload,
        gross_amount: '1000.00',
        signature_key: validSignature,
      })
    ).toBe(false);
  });

  it('rejects a wrong signature of the same length', () => {
    const wrong = 'f'.repeat(validSignature.length);
    expect(verifyWebhookSignature({ ...payload, signature_key: wrong })).toBe(false);
  });

  it('rejects a signature of the wrong length without throwing', () => {
    expect(verifyWebhookSignature({ ...payload, signature_key: 'short' })).toBe(false);
  });

  it('rejects an empty signature', () => {
    expect(verifyWebhookSignature({ ...payload, signature_key: '' })).toBe(false);
  });

  it('rejects everything when no server key is configured', () => {
    vi.stubEnv('MIDTRANS_SERVER_KEY', '');
    expect(verifyWebhookSignature({ ...payload, signature_key: validSignature })).toBe(false);
  });
});

describe('isMidtransConfigured', () => {
  it('is false without a server key', () => {
    vi.stubEnv('MIDTRANS_SERVER_KEY', '');
    expect(isMidtransConfigured()).toBe(false);
  });

  it('is true once a server key is set', () => {
    vi.stubEnv('MIDTRANS_SERVER_KEY', 'SB-Mid-server-abc');
    expect(isMidtransConfigured()).toBe(true);
  });
});

describe('isDemoPaymentMode', () => {
  it('is off unless explicitly enabled', () => {
    vi.stubEnv('PAYMENT_DEMO_MODE', '');
    expect(isDemoPaymentMode()).toBe(false);
  });

  it('is on when enabled outside production', () => {
    vi.stubEnv('PAYMENT_DEMO_MODE', 'true');
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('MIDTRANS_IS_PRODUCTION', 'false');
    expect(isDemoPaymentMode()).toBe(true);
  });

  it('refuses to enable in production even when the flag is set', () => {
    vi.stubEnv('PAYMENT_DEMO_MODE', 'true');
    vi.stubEnv('NODE_ENV', 'production');
    expect(isDemoPaymentMode()).toBe(false);
  });

  it('refuses to enable when pointed at the live gateway', () => {
    vi.stubEnv('PAYMENT_DEMO_MODE', 'true');
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('MIDTRANS_IS_PRODUCTION', 'true');
    expect(isDemoPaymentMode()).toBe(false);
  });
});
