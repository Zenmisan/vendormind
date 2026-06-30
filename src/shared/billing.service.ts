import { prisma } from './prisma/client';

export interface BillingCheckResult {
  allowed: boolean;
  overdraft?: boolean;
  reason?: string;
  balance?: number;
}

const WARNING_THRESHOLD = 2.00;
const OVERDRAFT_LIMIT = -2.50;

export class BillingService {
  static COSTS = {
    INBOUND_MESSAGE: 0.001,
    OUTBOUND_MESSAGE: 0.001,
    LLM_SONNET: 0.05,
    LLM_HAIKU: 0.01,
    MOCK_AGENT: 0.005,
  };

  static async canProcess(vendorId: bigint): Promise<BillingCheckResult> {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { walletBalance: true, name: true, email: true }
    });

    if (!vendor) return { allowed: false, reason: 'Vendor not found' };

    const balance = Number(vendor.walletBalance);

    if (balance <= OVERDRAFT_LIMIT) {
      return { allowed: false, reason: 'overdraft_exceeded', balance };
    }

    if (balance < 0) {
      return { allowed: true, overdraft: true, balance };
    }

    if (balance < WARNING_THRESHOLD) {
      BillingService.sendWarningAlert(vendor.email, vendor.name, balance).catch(() => {});
    }

    return { allowed: true, balance };
  }

  static async deduct(vendorId: bigint, costType: keyof typeof BillingService.COSTS): Promise<void> {
    const cost = BillingService.COSTS[costType];
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { walletBalance: { decrement: cost } }
    });
    console.log(`💸 Deducted $${cost} from vendor ${vendorId} for ${costType}`);
  }

  private static async sendWarningAlert(email: string, name: string, balance: number): Promise<void> {
    // TODO: replace with real SMTP send when SMTP_HOST/SMTP_USER/SMTP_PASS are set
    console.warn(`⚠️  LOW BALANCE ALERT — vendor "${name}" <${email}> balance: $${balance.toFixed(4)}`);
  }
}
