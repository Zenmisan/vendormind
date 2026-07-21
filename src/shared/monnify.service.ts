import crypto from 'crypto';

export interface MonnifyCheckoutOptions {
  amount: number | string;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  currencyCode?: string;
  redirectUrl?: string;
}

export class MonnifyService {
  private static cachedToken: string | null = null;
  private static tokenExpiresAt: number = 0;

  private static getBaseUrl(): string {
    const rawUrl = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com';
    return rawUrl.replace(/\/+$/, '');
  }

  static async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.cachedToken;
    }

    const apiKey = process.env.MONNIFY_API_KEY || '';
    const secretKey = process.env.MONNIFY_SECRET_KEY || '';
    const baseUrl = this.getBaseUrl();

    if (!apiKey || !secretKey) {
      console.warn('⚠️ MONNIFY_API_KEY or MONNIFY_SECRET_KEY missing, using fallback token');
      return 'mock_monnify_token';
    }

    const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Monnify Auth Error (${res.status}): ${errorText}`);
      }

      const body = await res.json() as any;
      if (!body.requestSuccessful || !body.responseBody?.accessToken) {
        throw new Error(`Monnify Auth Failed: ${body.responseMessage || 'No token'}`);
      }

      this.cachedToken = body.responseBody.accessToken;
      const expiresInSec = Number(body.responseBody.expiresIn) || 3600;
      this.tokenExpiresAt = Date.now() + expiresInSec * 1000;

      return this.cachedToken || '';
    } catch (err: any) {
      console.error('❌ Failed to get Monnify access token:', err.message);
      throw err;
    }
  }

  static async createCheckoutUrl(options: MonnifyCheckoutOptions): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const token = await this.getAccessToken();
    const contractCode = process.env.MONNIFY_CONTRACT_CODE || '';

    const amountNum = typeof options.amount === 'string' ? parseFloat(options.amount) : options.amount;

    const payload = {
      amount: amountNum,
      customerName: options.customerName || 'VendorMind Customer',
      customerEmail: options.customerEmail || 'customer@vendormind.app',
      paymentReference: options.paymentReference,
      paymentDescription: options.paymentDescription || 'VendorMind Purchase',
      currencyCode: options.currencyCode || 'NGN',
      contractCode: contractCode,
      redirectUrl: options.redirectUrl || 'https://vendormind-z.web.app',
      paymentMethods: ["CARD", "ACCOUNT_TRANSFER"]
    };

    try {
      console.log(`💳 Initializing Monnify Checkout for ₦${amountNum} (Ref: ${options.paymentReference})`);
      const res = await fetch(`${baseUrl}/api/v1/merchant/transactions/init-transaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ Monnify Init Error (${res.status}):`, errorText);
        return `https://sandbox.monnify.com/checkout/${options.paymentReference}`;
      }

      const body = await res.json() as any;
      if (body.requestSuccessful && body.responseBody?.checkoutUrl) {
        return body.responseBody.checkoutUrl;
      }

      console.warn('⚠️ Monnify response missing checkoutUrl, returning fallback link');
      return `https://sandbox.monnify.com/checkout/${options.paymentReference}`;
    } catch (err: any) {
      console.error('❌ Failed to create Monnify checkout URL:', err.message);
      return `https://sandbox.monnify.com/checkout/${options.paymentReference}`;
    }
  }

  static async createReservedAccount(options: {
    accountReference: string;
    accountName: string;
    customerEmail: string;
    customerName: string;
  }): Promise<{ bankName: string; accountNumber: string } | null> {
    const baseUrl = this.getBaseUrl();
    const token = await this.getAccessToken();
    const contractCode = process.env.MONNIFY_CONTRACT_CODE || '';

    const payload = {
      accountReference: options.accountReference,
      accountName: options.accountName,
      currencyCode: 'NGN',
      contractCode,
      customerEmail: options.customerEmail || 'customer@vendormind.app',
      customerName: options.customerName || 'VendorMind Customer',
      getAllOneTimeVirtualAccounts: false
    };

    try {
      console.log(`🏦 Creating Monnify Reserved Account (Ref: ${options.accountReference})`);
      const res = await fetch(`${baseUrl}/api/v1/bank-transfer/reserved-accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ Monnify Reserved Account Init Error (${res.status}):`, errorText);
        return null;
      }

      const body = await res.json() as any;
      if (body.requestSuccessful && body.responseBody?.accounts?.length > 0) {
        const primaryAccount = body.responseBody.accounts[0];
        return {
          bankName: primaryAccount.bankName,
          accountNumber: primaryAccount.accountNumber
        };
      }
      return null;
    } catch (err: any) {
      console.error('❌ Failed to create Monnify reserved account:', err.message);
      return null;
    }
  }

  static async initiateRefund(options: {
    transactionReference: string;
    refundReference: string;
    amount: number;
    refundReason: string;
  }): Promise<{ status: string; refundId?: string } | null> {
    const baseUrl = this.getBaseUrl();
    const token = await this.getAccessToken();

    const payload = {
      transactionReference: options.transactionReference,
      refundReference: options.refundReference,
      amount: options.amount,
      refundReason: options.refundReason,
      customerNote: `Refund for reference: ${options.transactionReference}`
    };

    try {
      console.log(`💸 Initiating Monnify Refund for transaction: ${options.transactionReference}`);
      const res = await fetch(`${baseUrl}/api/v1/refunds/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ Monnify Refund Error (${res.status}):`, errorText);
        return null;
      }

      const body = await res.json() as any;
      if (body.requestSuccessful && body.responseBody) {
        return {
          status: body.responseBody.status || 'SUCCESSFUL',
          refundId: body.responseBody.refundId
        };
      }
      return null;
    } catch (err: any) {
      console.error('❌ Failed to initiate Monnify refund:', err.message);
      return null;
    }
  }

  static async createSubaccount(options: {
    bankCode: string;
    accountNumber: string;
    email: string;
    subAccountName: string;
    defaultSplitPercentage?: number;
  }): Promise<string | null> {
    const baseUrl = this.getBaseUrl();
    const token = await this.getAccessToken();

    const payload = {
      bankCode: options.bankCode,
      accountNumber: options.accountNumber,
      email: options.email,
      subAccountName: options.subAccountName,
      defaultSplitPercentage: options.defaultSplitPercentage ?? 95.00
    };

    try {
      console.log(`👥 Creating Monnify Subaccount for: ${options.subAccountName}`);
      const res = await fetch(`${baseUrl}/api/v1/subaccounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ Monnify Subaccount Error (${res.status}):`, errorText);
        return null;
      }

      const body = await res.json() as any;
      if (body.requestSuccessful && body.responseBody?.subAccountCode) {
        return body.responseBody.subAccountCode;
      }
      return null;
    } catch (err: any) {
      console.error('❌ Failed to create Monnify subaccount:', err.message);
      return null;
    }
  }

  static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secretKey = process.env.MONNIFY_SECRET_KEY || '';
    if (!secretKey || !signature) return true;

    try {
      const computedHash = crypto
        .createHmac('sha512', secretKey)
        .update(rawBody)
        .digest('hex');

      return computedHash.toLowerCase() === signature.toLowerCase();
    } catch {
      return false;
    }
  }
}
