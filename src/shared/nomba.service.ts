import { createHmac } from 'crypto';

const BASE = process.env.NOMBA_BASE_URL || 'https://api.nomba.com';
const CLIENT_ID = () => process.env.NOMBA_CLIENT_ID || '';
const CLIENT_SECRET = () => process.env.NOMBA_CLIENT_SECRET || '';
const ACCOUNT_ID = () => process.env.NOMBA_ACCOUNT_ID || '';
const WEBHOOK_SECRET = () => process.env.NOMBA_WEBHOOK_SECRET || '';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const res = await fetch(`${BASE}/v1/auth/token/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accountId': ACCOUNT_ID(),
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID(),
      client_secret: CLIENT_SECRET(),
    }),
  });

  if (!res.ok) throw new Error(`Nomba auth failed: ${await res.text()}`);
  const body = await res.json() as any;
  const token = body.access_token as string;
  const expiresIn = (body.expires_in ?? 1800) as number;

  tokenCache = { token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

function authHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'accountId': ACCOUNT_ID(),
  };
}

export interface NombaCheckoutResult {
  checkoutLink: string;
  orderReference: string;
}

export class NombaService {
  static async createCheckoutOrder(params: {
    amountNGN: number;
    orderReference: string;
    callbackUrl?: string;
    customerEmail?: string;
    customerId?: string;
    metadata?: Record<string, string>;
  }): Promise<NombaCheckoutResult> {
    const token = await getAccessToken();

    const res = await fetch(`${BASE}/v1/checkout/order`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        order: {
          amount: params.amountNGN.toFixed(2),
          currency: 'NGN',
          orderReference: params.orderReference,
          callbackUrl: params.callbackUrl,
          customerEmail: params.customerEmail,
          customerId: params.customerId,
          orderMetaData: params.metadata,
        },
      }),
    });

    if (!res.ok) throw new Error(`Nomba checkout failed: ${await res.text()}`);
    const body = await res.json() as any;

    if (body.code !== '00') throw new Error(`Nomba checkout error: ${body.description}`);
    return {
      checkoutLink: body.data.checkoutLink,
      orderReference: body.data.orderReference,
    };
  }

  static async verifyTransaction(orderReference: string): Promise<{ paid: boolean; amount: number }> {
    const token = await getAccessToken();

    const res = await fetch(`${BASE}/v1/checkout/order/${encodeURIComponent(orderReference)}`, {
      headers: authHeaders(token),
    });

    if (!res.ok) throw new Error(`Nomba verify failed: ${await res.text()}`);
    const body = await res.json() as any;

    return {
      paid: body.data?.status === 'PAID' || body.data?.status === 'SUCCESS',
      amount: Number(body.data?.amount ?? 0),
    };
  }

  // Verify webhook HMAC signature.
  // Header name: 'x-nomba-signature' (confirm in Nomba dashboard if verification fails).
  static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!WEBHOOK_SECRET()) return true; // skip verification if secret not set
    const hash = createHmac('sha512', WEBHOOK_SECRET()).update(rawBody).digest('hex');
    return hash === signature;
  }
}
