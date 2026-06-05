import makeWASocket, { 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { usePrismaAuthState } from './auth';
import { pino } from 'pino';
import * as dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { inboundQueue, OUTBOUND_QUEUE, OutboundMessageJob, InboundMessageJob } from '../shared/queue';
import { redisConnection } from '../shared/redis';
import { prisma } from '../shared/prisma/client';

dotenv.config();

const logger = pino({ level: 'info' });

async function startSock(vendorId: string = '1') {
  const { state, saveCreds } = await usePrismaAuthState(vendorId);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const vId = BigInt(vendorId);
  
  console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    logger
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('QR Code generated, storing in DB...');
      await prisma.whatsAppSession.upsert({
        where: { sessionId: `${vendorId}:qr` },
        update: { data: { qr }, updatedAt: new Date() },
        create: { 
          vendorId: vId,
          sessionId: `${vendorId}:qr`, 
          data: { qr } 
        }
      });
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        startSock(vendorId);
      }
    } else if (connection === 'open') {
      console.log('🚀 WhatsApp Fleet Worker: Connection opened');
      // Remove QR once connected
      await prisma.whatsAppSession.deleteMany({
        where: { sessionId: `${vendorId}:qr` }
      });
    }
  });

  // Handle Incoming Messages
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        if (!msg.key.fromMe && msg.message) {
          const customerPhone = msg.key.remoteJid?.split('@')[0] || '';
          const messageId = msg.key.id || '';
          
          let jobData: InboundMessageJob | null = null;

          const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
          if (text) {
            jobData = {
              vendorId: '1',
              customerPhone,
              messageId,
              type: 'text',
              content: text,
              timestamp: Number(msg.messageTimestamp) || Date.now()
            };
          } else if (msg.message.locationMessage) {
            jobData = {
              vendorId: '1',
              customerPhone,
              messageId,
              type: 'location',
              location: {
                lat: msg.message.locationMessage.degreesLatitude!,
                lng: msg.message.locationMessage.degreesLongitude!
              },
              timestamp: Number(msg.messageTimestamp) || Date.now()
            };
          } else if (msg.message.audioMessage) {
             console.log(`🎙️ Received voice note from ${customerPhone}. Transcribing at edge...`);
             // In Phase 4, we'd use Deepgram here.
             const transcription = "[Transcription Stub: User asked for the price of coffee]";
             
             jobData = {
              vendorId: '1',
              customerPhone,
              messageId,
              type: 'text', 
              content: transcription,
              timestamp: Number(msg.messageTimestamp) || Date.now()
            };
          }

          if (jobData) {
            console.log(`📥 Enqueuing inbound message from ${customerPhone}`);
            await inboundQueue.add(
              `${customerPhone}:${messageId}`, 
              jobData,
              { jobId: messageId }
            );
          }
        }
      }
    }
  });

  // Handle Outbound Messages
  new Worker<OutboundMessageJob>(OUTBOUND_QUEUE, async (job) => {
    const { remoteJid, content } = job.data;
    console.log(`📤 Sending message to ${remoteJid}`);
    await sock.sendMessage(remoteJid, { text: content });
  }, { connection: redisConnection });

  return sock;
}

startSock().catch(err => console.error('Failed to start socket:', err));
