import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { usePrismaAuthState } from './auth';
import { pino } from 'pino';
import Groq from 'groq-sdk';
import { Worker } from 'bullmq';
import { inboundQueue, OUTBOUND_QUEUE, OutboundMessageJob, InboundMessageJob } from '../shared/queue';
import { redisConnection } from '../shared/redis';
import { prisma } from '../shared/prisma/client';

const logger = pino({ level: 'silent' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const VENDOR_ID = process.env.VENDOR_ID || '1';

async function transcribeAudio(msg: any): Promise<string | null> {
  try {
    const buffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;
    const file = new File([buffer], 'audio.ogg', { type: 'audio/ogg; codecs=opus' });
    const result = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      response_format: 'text'
    });
    return typeof result === 'string' ? result : (result as any).text || null;
  } catch (err: any) {
    console.error('Groq Whisper transcription failed:', err.message);
    return null;
  }
}

async function startSock(vendorId: string = VENDOR_ID) {
  const { state, saveCreds } = await usePrismaAuthState(vendorId);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const vId = BigInt(vendorId);

  console.log(`[Vendor ${vendorId}] using WA v${version.join('.')}, isLatest: ${isLatest}`);

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
      await prisma.whatsAppSession.upsert({
        where: { sessionId: `${vendorId}:qr` },
        update: { data: { qr }, updatedAt: new Date() },
        create: { vendorId: vId, sessionId: `${vendorId}:qr`, data: { qr } }
      });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startSock(vendorId);
    } else if (connection === 'open') {
      console.log(`🚀 [Vendor ${vendorId}] WhatsApp connected`);
      await prisma.whatsAppSession.upsert({
        where: { sessionId: `${vendorId}:qr` },
        update: { data: { connected: true }, updatedAt: new Date() },
        create: { vendorId: vId, sessionId: `${vendorId}:qr`, data: { connected: true } },
      });
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      if (msg.key.fromMe || !msg.message) continue;

      const customerPhone = msg.key.remoteJid?.split('@')[0] || '';
      const messageId = msg.key.id || '';
      let jobData: InboundMessageJob | null = null;

      const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
      if (text) {
        jobData = { vendorId, customerPhone, messageId, type: 'text', content: text, timestamp: Number(msg.messageTimestamp) || Date.now() };
      } else if (msg.message.locationMessage) {
        jobData = {
          vendorId,
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
        console.log(`🎙️ [Vendor ${vendorId}] Voice note from ${customerPhone} — transcribing...`);
        const transcription = await transcribeAudio(msg);
        if (transcription) {
          jobData = { vendorId, customerPhone, messageId, type: 'text', content: transcription, timestamp: Number(msg.messageTimestamp) || Date.now() };
          console.log(`🎙️ Transcribed: "${transcription}"`);
        } else {
          jobData = { vendorId, customerPhone, messageId, type: 'text', content: "[Voice note received but could not be transcribed. Please type your message.]", timestamp: Number(msg.messageTimestamp) || Date.now() };
        }
      }

      if (jobData) {
        console.log(`📥 [Vendor ${vendorId}] Enqueuing message from ${customerPhone}`);
        await inboundQueue.add(`${customerPhone}:${messageId}`, jobData, { jobId: messageId });
      }
    }
  });

  // Outbound sender
  new Worker<OutboundMessageJob>(OUTBOUND_QUEUE, async (job) => {
    const { remoteJid, content } = job.data;
    console.log(`📤 [Vendor ${vendorId}] Sending to ${remoteJid}`);
    await sock.sendMessage(remoteJid, { text: content });
  }, { connection: redisConnection });

  return sock;
}

startSock().catch(err => console.error('Failed to start socket:', err));
