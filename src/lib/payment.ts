import crypto from 'crypto';

/**
 * Read at call time, not module load, so the production guard reflects the
 * environment actually in effect rather than whatever was set when the module
 * was first imported.
 */
function isProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}

function snapBase(): string {
  return isProduction() ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
}

function apiBase(): string {
  return isProduction() ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
}

export function getServerKey(): string {
  return process.env.MIDTRANS_SERVER_KEY ?? '';
}

export function isMidtransConfigured(): boolean {
  return getServerKey().length > 0;
}

/**
 * Demo mode lets the app be exercised end-to-end without a payment gateway.
 * It must be opted into explicitly and is refused in production so a
 * misconfigured deploy can never hand out paid plans for free.
 */
export function isDemoPaymentMode(): boolean {
  return (
    process.env.PAYMENT_DEMO_MODE === 'true' &&
    process.env.NODE_ENV !== 'production' &&
    !isProduction()
  );
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${getServerKey()}:`).toString('base64')}`;
}

export interface SnapTransactionInput {
  orderId: string;
  amount: number;
  customerName?: string | null;
  customerEmail?: string | null;
  itemName: string;
}

export interface SnapTransactionResult {
  token: string;
  redirectUrl: string;
}

/** Creates a Snap transaction and returns the token the browser widget needs. */
export async function createSnapTransaction(
  input: SnapTransactionInput
): Promise<SnapTransactionResult> {
  const response = await fetch(`${snapBase()}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.amount,
      },
      item_details: [
        {
          id: input.orderId,
          price: input.amount,
          quantity: 1,
          name: input.itemName.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: input.customerName?.slice(0, 50) || 'Pelanggan',
        email: input.customerEmail || undefined,
      },
      credit_card: { secure: true },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Midtrans Snap error ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as { token: string; redirect_url: string };
  return { token: data.token, redirectUrl: data.redirect_url };
}

export interface TransactionStatus {
  orderId: string;
  transactionStatus: string;
  fraudStatus?: string;
  grossAmount: string;
  statusCode: string;
  signatureKey?: string;
}

/** Asks Midtrans for the authoritative status of an order. */
export async function fetchTransactionStatus(
  orderId: string
): Promise<TransactionStatus | null> {
  const response = await fetch(`${apiBase()}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: 'application/json', Authorization: authHeader() },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Midtrans status error ${response.status}`);
  }

  const data = (await response.json()) as Record<string, string>;
  return {
    orderId: data.order_id,
    transactionStatus: data.transaction_status,
    fraudStatus: data.fraud_status,
    grossAmount: data.gross_amount,
    statusCode: data.status_code,
    signatureKey: data.signature_key,
  };
}

/** A transaction counts as paid only when settled, or captured without fraud suspicion. */
export function isPaidStatus(status: {
  transactionStatus: string;
  fraudStatus?: string;
}): boolean {
  if (status.transactionStatus === 'settlement') return true;
  if (status.transactionStatus === 'capture') return status.fraudStatus === 'accept';
  return false;
}

export function isFailedStatus(transactionStatus: string): boolean {
  return ['cancel', 'deny', 'expire', 'failure'].includes(transactionStatus);
}

/**
 * Verifies a webhook payload really came from Midtrans.
 * Signature is SHA512(order_id + status_code + gross_amount + server_key).
 */
export function verifyWebhookSignature(payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const serverKey = getServerKey();
  if (!serverKey || !payload.signature_key) return false;

  const expected = crypto
    .createHash('sha512')
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`
    )
    .digest('hex');

  const provided = payload.signature_key;
  if (provided.length !== expected.length) return false;

  // Constant-time compare so a mismatch cannot be narrowed down by timing.
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}
