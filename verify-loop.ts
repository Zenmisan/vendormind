import { inboundQueue, OUTBOUND_QUEUE, OutboundMessageJob } from './src/shared/queue';
import { redisConnection } from './src/shared/redis';
import { prisma } from './src/shared/prisma/client';
import { Worker } from 'bullmq';
import { ContextService } from './src/shared/context.service';

async function verify() {
  console.log('🚀 Starting Comprehensive Phase 2 Verification');

  const customerPhone = '234999888777';
  const vendorId = '1';
  const testMessage = 'what is your shipping policy?';

  // 1. Clear previous test data for this customer
  const customer = await prisma.customer.findUnique({
    where: { vendorId_phoneNumber: { vendorId: BigInt(vendorId), phoneNumber: customerPhone } }
  });
  if (customer) {
    await prisma.wa_session.deleteMany({ where: { customerId: customer.id } });
    console.log('🧹 Cleaned up existing session context.');
  }

  // 2. Set up a one-time listener for the outbound queue
  let outboundResult: OutboundMessageJob | null = null;
  const outboundWorker = new Worker<OutboundMessageJob>(OUTBOUND_QUEUE, async (job) => {
    outboundResult = job.data;
    console.log('✅ Received Outbound Job:', job.data.content);
  }, { connection: redisConnection });

  // 3. Enqueue the inbound message
  console.log('📤 Enqueueing inbound message...');
  const messageId = `test-${Date.now()}`;
  await inboundQueue.add(messageId, {
    vendorId,
    customerPhone,
    messageId,
    type: 'text',
    content: testMessage,
    timestamp: Date.now()
  });

  // 4. Wait for processing (give it 10 seconds)
  console.log('⏳ Waiting for processor...');
  let attempts = 0;
  while (!outboundResult && attempts < 10) {
    await new Promise(r => setTimeout(r, 1000));
    attempts++;
  }

  if (outboundResult) {
    console.log('✨ LOOP SUCCESSFUL!');
    
    // 5. Verify Context in DB
    const finalCustomer = await prisma.customer.findUnique({
      where: { vendorId_phoneNumber: { vendorId: BigInt(vendorId), phoneNumber: customerPhone } }
    });
    if (finalCustomer) {
      const context = await ContextService.getContext(finalCustomer.id);
      console.log('📝 Verified Context Store:', {
        summary: context.summary,
        recentCount: context.recentMessages.length
      });
    }
  } else {
    console.error('❌ LOOP FAILED: Timed out waiting for outbound reply.');
  }

  await outboundWorker.close();
  process.exit(outboundResult ? 0 : 1);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
