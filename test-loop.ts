import { inboundQueue, OUTBOUND_QUEUE, OutboundMessageJob } from './src/shared/queue';
import { redisConnection } from './src/shared/redis';
import { Worker } from 'bullmq';

async function mockCustomer() {
  const customerPhone = '2348123456789';
  const vendorId = '1';

  // 1. Listen for replies
  const outboundWorker = new Worker<OutboundMessageJob>(OUTBOUND_QUEUE, async (job) => {
    console.log(`\n🤖 BOT REPLIED: ${job.data.content}\n`);
  }, { connection: redisConnection });

  console.log('--- Mock Customer Session Started ---');
  console.log('Type "exit" to quit.\n');

  // 2. Interactive Loop
  const prompt = "Customer: ";
  process.stdout.write(prompt);

  for await (const line of console) {
    const input = line.trim();
    if (input === 'exit') break;

    const messageId = `mock-${Date.now()}`;
    
    if (input.startsWith('loc:')) {
      const [lat, lng] = input.replace('loc:', '').split(',').map(Number);
      await inboundQueue.add(`${customerPhone}:${messageId}`, {
        vendorId,
        customerPhone,
        messageId,
        type: 'location',
        location: { lat, lng },
        timestamp: Date.now()
      });
      console.log(`(Sent Location: ${lat}, ${lng})`);
    } else {
      await inboundQueue.add(`${customerPhone}:${messageId}`, {
        vendorId,
        customerPhone,
        messageId,
        type: 'text',
        content: input,
        timestamp: Date.now()
      });
    }

    // Wait a bit for the reply to show up before prompting again
    await new Promise(r => setTimeout(r, 1000));
    process.stdout.write(prompt);
  }

  await outboundWorker.close();
  process.exit(0);
}

mockCustomer();
