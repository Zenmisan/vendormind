import { prisma } from '../src/shared/prisma/client';
import { Queue } from 'bullmq';
import { redisConnection } from '../src/shared/redis';

const API = 'http://localhost:3000';
const CUSTOMER_PHONE = '234999888777';

async function test() {
  console.log('=== Manual Messaging Verification ===');

  // Find or create customer
  let customer = await prisma.customer.findFirst({
    where: { vendorId: 1, phoneNumber: CUSTOMER_PHONE }
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        vendorId: 1,
        phoneNumber: CUSTOMER_PHONE,
        name: 'Test Customer'
      }
    });
  }

  const customerId = customer.id.toString();
  console.log(`Using Customer ID: ${customerId}`);

  // Flush outbound messages queue to start clean
  const OUTBOUND_QUEUE = 'outbound-messages';
  const queue = new Queue(OUTBOUND_QUEUE, { connection: redisConnection });
  await queue.drain();
  console.log('Drained outbound queue.');

  // Trigger manual message post
  console.log('Posting manual message...');
  const res = await fetch(`${API}/vendors/1/conversations/${customerId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Test manual message from verify script' })
  });

  if (!res.ok) {
    throw new Error(`Failed to post message: ${res.statusText} (${await res.text()})`);
  }

  console.log('✅ Posted successfully.');

  // Verify redis job creation
  console.log('Checking BullMQ outbound queue jobs...');
  const jobs = await queue.getJobs(['waiting', 'active']);
  const matchingJob = jobs.find(job => job.data.content === 'Test manual message from verify script');

  if (!matchingJob) {
    throw new Error('Verification failed: Manual message job was not found in outbound BullMQ queue');
  }

  console.log('✅ Found matching job in Queue.');
  console.log('Job data:', matchingJob.data);

  // Clean up
  await queue.close();
  console.log('=== Verification Passed ===');
}

test().catch(err => {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
});
