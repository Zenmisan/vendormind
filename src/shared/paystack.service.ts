import { createHmac } from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';
const secret = () => process.env.PAYSTACK_SECRET_KEY || '';

export interface PaystackInitResult {
  authorizationUrl: string;
  reference: string;
}

export class PaystackService {
  static async initializeTransaction(params: {
    email: string;
    amountKobo: number;
    reference: string;
    metadata?: Record<string, unknown>;
    callbackUrl?: string;
  }): Promise<PaystackInitResult> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amountKobo,
        reference: params.reference,
        metadata: params.metadata,
        callback_url: params.callbackUrl,
      }),
    });

    if (!res.ok) throw new Error(`Paystack init failed: ${await res.text()}`);
    const body = await res.json() as any;
    return {
      authorizationUrl: body.data.authorization_url,
      reference: body.data.reference,
    };
  }

  static async verifyTransaction(reference: string): Promise<{ paid: boolean; amountKobo: number; metadata: any }> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret()}` },
    });
    if (!res.ok) throw new Error(`Paystack verify failed: ${await res.text()}`);
    const body = await res.json() as any;
    return {
      paid: body.data.status === 'success',
      amountKobo: body.data.amount,
      metadata: body.data.metadata,
    };
  }

  static verifyWebhookSignature(rawBody: string, xPaystackSignature: string): boolean {
    const hash = createHmac('sha512', secret()).update(rawBody).digest('hex');
    return hash === xPaystackSignature;
  }
}
