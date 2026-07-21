import { prisma } from '../src/shared/prisma/client';

async function checkStatus() {
  console.log('🔍 Checking main WhatsApp connection sessions in DB...\n');

  const sessions = await prisma.whatsAppSession.findMany({
    where: {
      OR: [
        { sessionId: { endsWith: ':creds' } },
        { sessionId: { endsWith: ':qr' } }
      ]
    },
    orderBy: { updatedAt: 'desc' }
  });

  if (sessions.length === 0) {
    console.log('⚠️ No active WhatsApp creds or QR sessions found in database.');
    process.exit(0);
  }

  for (const s of sessions) {
    const data = s.data as any;
    const isCreds = s.sessionId.endsWith(':creds');
    const isQr = s.sessionId.endsWith(':qr');
    const isConnected = isCreds ? !!(data?.me?.id || data?.registered) : !!data?.connected;

    console.log(`📌 Vendor ID: ${s.vendorId} | Session Key: "${s.sessionId}"`);
    console.log(`   - Type: ${isCreds ? 'AUTH CREDENTIALS' : 'QR / STATUS'}`);
    console.log(`   - Connected Status: ${isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}`);
    if (isCreds && data?.me) {
      console.log(`   - WhatsApp Account Name: ${data.me.name || 'Unknown'}`);
      console.log(`   - WhatsApp Account ID: ${data.me.id || 'Unknown'}`);
    }
    if (isQr) {
      if (data?.qr) console.log(`   - QR Code: Available (ready to scan)`);
      if (data?.pairingCode) console.log(`   - Pairing Code: ${data.pairingCode}`);
    }
    console.log(`   - Last Updated: ${s.updatedAt.toISOString()}\n`);
  }

  process.exit(0);
}

checkStatus().catch(err => {
  console.error('❌ Check failed:', err);
  process.exit(1);
});
