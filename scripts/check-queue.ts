import { outboundQueue } from '../src/shared/queue';

async function main() {
  const [waiting, active, completed, failed] = await Promise.all([
    outboundQueue.getJobs(['waiting']),
    outboundQueue.getJobs(['active']),
    outboundQueue.getJobs(['completed']),
    outboundQueue.getJobs(['failed'])
  ]);

  console.log(`Waiting: ${waiting.length}`);
  console.log(`Active: ${active.length}`);
  console.log(`Completed: ${completed.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('--- Sample Failed Jobs ---');
    for (const job of failed.slice(0, 10)) {
      console.log(`ID: ${job.id}, Data: ${JSON.stringify(job.data)}, Reason: ${job.failedReason}`);
    }
  }
  
  if (active.length > 0) {
    console.log('--- Sample Active Jobs ---');
    for (const job of active.slice(0, 10)) {
      console.log(`ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);
    }
  }

  if (waiting.length > 0) {
    console.log('--- Sample Waiting Jobs ---');
    for (const job of waiting.slice(0, 10)) {
      console.log(`ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);
    }
  }
}

main().then(() => process.exit(0)).catch(console.error);
