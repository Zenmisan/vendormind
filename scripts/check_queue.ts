import { inboundQueue, outboundQueue } from "../src/shared/queue";

async function run() {
  const inboundJobs = await inboundQueue.getJobs(["waiting", "active", "completed", "failed"]);
  console.log("Inbound Queue Jobs count:", inboundJobs.length);
  for (const job of inboundJobs) {
    console.log(`Job ID: ${job.id}, Status: ${await job.getState()}, Data:`, job.data);
  }

  const outboundJobs = await outboundQueue.getJobs(["waiting", "active", "completed", "failed"]);
  console.log("Outbound Queue Jobs count:", outboundJobs.length);
  for (const job of outboundJobs) {
    console.log(`Job ID: ${job.id}, Status: ${await job.getState()}, Data:`, job.data);
  }
  
  process.exit(0);
}

run();
