import { outboundQueue } from '../src/shared/queue';

async function sendTestMessage() {
  const vendorId = '2';
  const targetPhone = '2347016282012'; // Vendor 2 phone number
  const remoteJid = `${targetPhone}@s.whatsapp.net`;
  const text = '🤖 VendorMind Outbound Verification: WhatsApp AI Agent message delivery system is operational!';

  console.log(`🚀 Enqueuing outbound WhatsApp test message for Vendor ${vendorId} to ${remoteJid}...`);

  const job = await outboundQueue.add('test-message-' + Date.now(), {
    vendorId,
    remoteJid,
    content: text
  });

  console.log(`✅ Job enqueued successfully! Job ID: ${job.id}`);
  console.log(`📲 Check PM2 logs for vm-fleet-worker to verify delivery status.`);
  process.exit(0);
}

sendTestMessage().catch(err => {
  console.error('❌ Failed to enqueue test message:', err);
  process.exit(1);
});
