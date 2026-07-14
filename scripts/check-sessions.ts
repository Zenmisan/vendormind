import { prisma } from '../src/shared/prisma/client';

async function main() {
  const sessions = await prisma.whatsAppSession.findMany();
  console.log('--- whatsapp_sessions ---');
  for (const s of sessions) {
    const dataStr = JSON.stringify(s.data);
    console.log(`ID: ${s.id}, Vendor: ${s.vendorId}, SessionId: ${s.sessionId}, Data length: ${dataStr.length}`);
  }
}

main().catch(console.error);
