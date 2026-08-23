import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  planFromAmount,
  isSettled,
  verifyMidtransSignature,
} from '@/lib/payment';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';

describe('planFromAmount', () => {
  it('maps exact tier prices to their plan', () => {
    expect(planFromAmount(SUBSCRIPTION_TIERS.STARTER.price)).toBe('STARTER');
    expect(planFromAmount(SUBSCRIPTION_TIERS.PREMIUM.price)).toBe('PREMIUM');
    expect(planFromAmount(SUBSCRIPTION_TIERS.BUSINESS.price)).toBe('BUSINESS');
  });

  it('does not round an arbitrary amount up into a paid tier', () => {
    expect(planFromAmount(1)).toBeNull();
    expect(planFromAmount(0)).toBeNull();
    expect(planFromAmount(500000)).toBeNull();
    expect(planFromAmount(198999)).toBeNull();
  });
});

describe('isSettled', () => {
  it('accepts settlement', () => {
    expect(isSettled({ transaction_status: 'settlement' })).toBe(true);
  });

  it('accepts capture only when fraud check passed', () => {
    expect(
      isSettled({ transaction_status: 'capture', fraud_status: 'accept' })
    ).toBe(true);
    expect(
      isSettled({ transaction_status: 'capture', fraud_status: 'challenge' })
    ).toBe(false);
    expect(isSettled({ transaction_status: 'capture' })).toBe(false);
  });

  it('rejects pending and failed states', () => {
    for (const status of ['pending', 'deny', 'cancel', 'expire', 'failure']) {
      expect(isSettled({ transaction_status: status })).toBe(false);
    }
    expect(isSettled({})).toBe(false);
  });
});

describe('verifyMidtransSignature', () => {
  const serverKey = 'SB-Mid-server-testkey';
  const body = {
    order_id: 'INV-123',
    status_code: '200',
    gross_amount: '199000.00',
  };

  const sign = (key: string) =>
    crypto
      .createHash('sha512')
      .update(`${body.order_id}${body.status_code}${body.gross_amount}${key}`)
      .digest('hex');

  it('accepts a correctly signed payload', () => {
    expect(
      verifyMidtransSignature(
        { ...body, signature_key: sign(serverKey) },
        serverKey
      )
    ).toBe(true);
  });

  it('rejects a payload signed with a different key', () => {
    expect(
      verifyMidtransSignature(
        { ...body, signature_key: sign('wrong-key') },
        serverKey
      )
    ).toBe(false);
  });

  it('rejects everything when the server key is missing', () => {
    // Regression: an empty key made the signature reproducible by anyone.
    expect(
      verifyMidtransSignature({ ...body, signature_key: sign('') }, '')
    ).toBe(false);
  });

  it('rejects payloads with missing fields', () => {
    expect(verifyMidtransSignature({ signature_key: 'x' }, serverKey)).toBe(
      false
    );
    expect(verifyMidtransSignature(body, serverKey)).toBe(false);
  });

  it('rejects a signature of the wrong length without throwing', () => {
    expect(
      verifyMidtransSignature({ ...body, signature_key: 'short' }, serverKey)
    ).toBe(false);
  });
});
