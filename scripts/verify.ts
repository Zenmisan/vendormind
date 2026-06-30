/**
 * End-to-end smoke test — verifies the full message loop works without WhatsApp.
 * Sends browse → add to cart → location pin, checks bot replies for each.
 * Usage: bun run scripts/verify.ts
 */

import { inboundQueue, OUTBOUND_QUEUE, OutboundMessageJob } from '../src/shared/queue';
import { redisConnection } from '../src/shared/redis';
import { prisma } from '../src/shared/prisma/client';
import { ContextService } from '../src/shared/context.service';
import { Worker } from 'bullmq';

const CUSTOMER_PHONE = '234999888777';
const VENDOR_ID = process.env.VENDOR_ID || '1';
const TIMEOUT_MS = 8000;

async function send(type: 'text' | 'location', content?: string, location?: { lat: number; lng: number }) {
  const messageId = `verify-${Date.now()}`;
  await inboundQueue.add(`${CUSTOMER_PHONE}:${messageId}`, {
    vendorId: VENDOR_ID, customerPhone: CUSTOMER_PHONE, messageId, type,
    content, location, timestamp: Date.now()
  });
}

async function waitForReply(label: string): Promise<string | null> {
  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve(null), TIMEOUT_MS);
    const worker = new Worker<OutboundMessageJob>(OUTBOUND_QUEUE, async (job) => {
      clearTimeout(timeout);
      await worker.close();
      resolve(job.data.content);
    }, { connection: redisConnection });
  });
}

async function main() {
  console.log('=== VendorMind E2E Verification ===\n');

  // Clean up previous test session
  const existing = await prisma.customer.findUnique({
    where: { vendorId_phoneNumber: { vendorId: BigInt(VENDOR_ID), phoneNumber: CUSTOMER_PHONE } }
  });
  if (existing) {
    await prisma.wa_session.deleteMany({ where: { customerId: existing.id } });
    console.log('Cleaned up previous session context.\n');
  }

  const steps: Array<{ label: string; fn: () => Promise<void> }> = [
    { label: 'Browse catalog', fn: () => send('text', 'browse catalog') },
    { label: 'Add to cart',    fn: () => send('text', 'add coffee to cart') },
    { label: 'Location pin',   fn: () => send('location', undefined, { lat: 6.5244, lng: 3.3792 }) },
    { label: 'Policy query',   fn: () => send('text', 'what is your refund policy?') },
  ];

  let passed = 0;
  for (const step of steps) {
    process.stdout.write(`  ${step.label}... `);
    await step.fn();
    const reply = await waitForReply(step.label);
    if (reply) {
      console.log(`✅ Got reply (${reply.length} chars)`);
      passed++;
    } else {
      console.log('❌ Timed out');
    }
  }

  // Verify context was saved
  const finalCustomer = await prisma.customer.findUnique({
    where: { vendorId_phoneNumber: { vendorId: BigInt(VENDOR_ID), phoneNumber: CUSTOMER_PHONE } }
  });
  if (finalCustomer) {
    const ctx = await ContextService.getContext(finalCustomer.id);
    console.log(`\nContext: summary="${ctx.summary.slice(0, 60)}...", recent=${ctx.recentMessages.length} msgs`);
  }

  console.log(`\n=== ${passed}/${steps.length} steps passed ===`);
  process.exit(passed === steps.length ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(1); });
