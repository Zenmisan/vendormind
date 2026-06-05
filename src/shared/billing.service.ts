import { prisma } from './prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface BillingCheckResult {
  allowed: boolean;
  reason?: string;
  balance?: number;
}

export class BillingService {
  // Approximate costs in USD
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
      select: { walletBalance: true }
    });

    if (!vendor) return { allowed: false, reason: 'Vendor not found' };

    const balance = Number(vendor.walletBalance);
    // Minimum balance to start a transaction
    if (balance < 0.10) {
      return { allowed: false, reason: 'Insufficient wallet balance', balance };
    }

    return { allowed: true, balance };
  }

  static async deduct(vendorId: bigint, costType: keyof typeof BillingService.COSTS): Promise<void> {
    const cost = BillingService.COSTS[costType];
    
    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        walletBalance: {
          decrement: cost
        }
      }
    });

    console.log(`💸 Deducted $${cost} from vendor ${vendorId} for ${costType}`);
  }
}
