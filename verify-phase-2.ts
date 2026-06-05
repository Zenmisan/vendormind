import { inboundQueue, OUTBOUND_QUEUE, OutboundMessageJob } from './src/shared/queue';
import { redisConnection } from './src/shared/redis';
import { Worker } from 'bullmq';

async function verifyPhase2() {
  const customerPhone = '2348123456789';
  const vendorId = '1';
  let replyCount = 0;

  console.log('--- Phase 2 Verification Started ---');

  const outboundWorker = new Worker<OutboundMessageJob>(OUTBOUND_QUEUE, async (job) => {
    console.log(`🤖 BOT REPLIED: ${job.data.content}`);
    replyCount++;
  }, { connection: redisConnection });

  // 1. Send "browse catalog"
  console.log('📤 Sending: "browse catalog"');
  await inboundQueue.add(`test-1`, {
    vendorId, customerPhone, messageId: 'test-msg-1', type: 'text', content: 'browse catalog', timestamp: Date.now()
  });

  await new Promise(r => setTimeout(r, 3000));

  // 2. Send "add coffee to cart"
  console.log('📤 Sending: "add coffee to cart"');
  await inboundQueue.add(`test-2`, {
    vendorId, customerPhone, messageId: 'test-msg-2', type: 'text', content: 'add coffee to cart', timestamp: Date.now()
  });

  await new Promise(r => setTimeout(r, 3000));

  // 3. Send Location Pin
  console.log('📤 Sending: Location Pin');
  await inboundQueue.add(`test-3`, {
    vendorId, customerPhone, messageId: 'test-msg-3', type: 'location', location: { lat: 6.5244, lng: 3.3792 }, timestamp: Date.now()
  });

  await new Promise(r => setTimeout(r, 3000));

  console.log(`--- Verification Finished. Received ${replyCount} replies. ---`);
  await outboundWorker.close();
  process.exit(0);
}

verifyPhase2();
