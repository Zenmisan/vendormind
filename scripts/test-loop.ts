/**
 * Interactive REPL for testing the bot without a real WhatsApp connection.
 * Usage: bun run scripts/test-loop.ts
 *
 * Commands:
 *   Type any message   → sends as text
 *   loc:<lat>,<lng>    → sends a location pin (e.g. loc:6.5244,3.3792)
 *   exit               → quit
 */

import { inboundQueue, OUTBOUND_QUEUE, OutboundMessageJob } from '../src/shared/queue';
import { redisConnection } from '../src/shared/redis';
import { Worker } from 'bullmq';

async function main() {
  const customerPhone = '2348123456789';
  const vendorId = process.env.VENDOR_ID || '1';

  const outboundWorker = new Worker<OutboundMessageJob>(OUTBOUND_QUEUE, async (job) => {
    console.log(`\n🤖 BOT: ${job.data.content}\n`);
  }, { connection: redisConnection });

  console.log('--- VendorMind Test REPL ---');
  console.log('Type a message, "loc:<lat>,<lng>" for location, or "exit" to quit.\n');
  process.stdout.write('You: ');

  for await (const line of console) {
    const input = line.trim();
    if (input === 'exit') break;

    const messageId = `mock-${Date.now()}`;

    if (input.startsWith('loc:')) {
      const [lat, lng] = input.replace('loc:', '').split(',').map(Number);
      await inboundQueue.add(`${customerPhone}:${messageId}`, {
        vendorId, customerPhone, messageId, type: 'location',
        location: { lat, lng }, timestamp: Date.now()
      });
      console.log(`(Sent location: ${lat}, ${lng})`);
    } else {
      await inboundQueue.add(`${customerPhone}:${messageId}`, {
        vendorId, customerPhone, messageId, type: 'text',
        content: input, timestamp: Date.now()
      });
    }

    await new Promise(r => setTimeout(r, 1200));
    process.stdout.write('You: ');
  }

  await outboundWorker.close();
  process.exit(0);
}

main().catch(console.error);
