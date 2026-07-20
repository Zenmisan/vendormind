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

// socketMap tracks active sockets per vendor so we never double-start
const socketMap = new Map<string, ReturnType<typeof makeWASocket>>();

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

async function startSock(vendorId: string) {
  if (socketMap.has(vendorId)) return;
  let reconnectCount = 0;
  const { state, saveCreds } = await usePrismaAuthState(vendorId);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const vId = BigInt(vendorId);

  console.log(`[Vendor ${vendorId}] using WA v${version.join('.')}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    logger,
    browser: ['Mac OS', 'Chrome', '121.0.0.0'],
    connectTimeoutMs: 120000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 15000,
    retryRequestDelayMs: 250,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    shouldIgnoreJid: (jid) =>
      jid === 'status@broadcast' ||
      jid?.endsWith('@broadcast') ||
      jid?.endsWith('@g.us') ||
      jid?.endsWith('@newsletter'),
    getMessage: async (_key) => ({ conversation: '' }),
  });

  socketMap.set(vendorId, sock);
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Check if vendor requested pairing code instead of QR
      const pairingPhone = await redisConnection.get(`pairing_phone:${vendorId}`);
      if (pairingPhone && !state.creds.registered) {
        try {
          const code = await sock.requestPairingCode(pairingPhone.replace(/\D/g, ''));
          await redisConnection.del(`pairing_phone:${vendorId}`);
          console.log(`📱 [Vendor ${vendorId}] Pairing code: ${code}`);
          await prisma.whatsAppSession.upsert({
            where: { sessionId: `${vendorId}:qr` },
            update: { data: { pairingCode: code }, updatedAt: new Date() },
            create: { vendorId: vId, sessionId: `${vendorId}:qr`, data: { pairingCode: code } }
          });
        } catch (err: any) {
          console.error(`[Vendor ${vendorId}] Pairing code request failed:`, err.message);
        }
      } else {
        await prisma.whatsAppSession.upsert({
          where: { sessionId: `${vendorId}:qr` },
          update: { data: { qr }, updatedAt: new Date() },
          create: { vendorId: vId, sessionId: `${vendorId}:qr`, data: { qr } }
        });
      }
    }

    if (connection === 'close') {
      socketMap.delete(vendorId);
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

      // Always mark as disconnected so the portal reflects reality immediately
      await prisma.whatsAppSession.upsert({
        where: { sessionId: `${vendorId}:qr` },
        update: { data: { connected: false }, updatedAt: new Date() },
        create: { vendorId: vId, sessionId: `${vendorId}:qr`, data: { connected: false } },
      }).catch(() => {});

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        console.log(`[Vendor ${vendorId}] Logged out — clearing session`);
        await prisma.whatsAppSession.deleteMany({ where: { vendorId: vId } });
      } else if (statusCode !== 440) {
        reconnectCount++;
        const delay = Math.min(5000 * (2 ** Math.min(reconnectCount, 4)), 60000);
        console.log(`[Vendor ${vendorId}] Disconnected (${statusCode}) — reconnecting in ${delay/1000}s (attempt ${reconnectCount})`);
        setTimeout(() => startSock(vendorId), delay);
      }
    } else if (connection === 'open') {
      console.log(`🚀 [Vendor ${vendorId}] WhatsApp connected`);
      await prisma.whatsAppSession.upsert({
        where: { sessionId: `${vendorId}:qr` },
        update: { data: { connected: true }, updatedAt: new Date() },
        create: { vendorId: vId, sessionId: `${vendorId}:qr`, data: { connected: true } },
      });
    }
  });

  function extractMessageText(message: any): string | null {
    if (!message) return null;
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.ephemeralMessage?.message) return extractMessageText(message.ephemeralMessage.message);
    if (message.viewOnceMessage?.message) return extractMessageText(message.viewOnceMessage.message);
    if (message.viewOnceMessageV2?.message) return extractMessageText(message.viewOnceMessageV2.message);
    if (message.documentWithCaptionMessage?.message) return extractMessageText(message.documentWithCaptionMessage.message);
    return null;
  }

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      if (msg.key.fromMe || !msg.message) continue;

      const remoteJid = msg.key.remoteJid || '';

      // Only handle personal DMs — skip groups, broadcasts, status, newsletters
      if (!remoteJid.endsWith('@s.whatsapp.net')) continue;

      const customerPhone = remoteJid.split('@')[0];
      const customerName = msg.pushName?.trim() || undefined;
      const messageId = msg.key.id || '';
      const ts = Number(msg.messageTimestamp) || Date.now();
      let jobData: InboundMessageJob | null = null;

      const text = extractMessageText(msg.message);
      if (text) {
        jobData = { vendorId, customerPhone, customerName, messageId, type: 'text', content: text, timestamp: ts };
      } else if (msg.message.locationMessage) {
        jobData = {
          vendorId, customerPhone, customerName, messageId,
          type: 'location',
          location: {
            lat: msg.message.locationMessage.degreesLatitude!,
            lng: msg.message.locationMessage.degreesLongitude!
          },
          timestamp: ts
        };
      } else if (msg.message.audioMessage) {
        console.log(`🎙️ [Vendor ${vendorId}] Voice note from ${customerPhone} — transcribing...`);
        const transcription = await transcribeAudio(msg);
        if (transcription) {
          jobData = { vendorId, customerPhone, customerName, messageId, type: 'text', content: transcription, timestamp: ts };
          console.log(`🎙️ Transcribed: "${transcription}"`);
        } else {
          jobData = { vendorId, customerPhone, customerName, messageId, type: 'text', content: "[Voice note received but could not be transcribed. Please type your message.]", timestamp: ts };
        }
      }

      if (jobData) {
        console.log(`📥 [Vendor ${vendorId}] Enqueuing message from ${customerPhone}`);
        await inboundQueue.add(`${customerPhone}:${messageId}`, jobData, { jobId: messageId });
      }
    }
  });

  return sock;
}

// Single outbound worker shared across all vendors — routes via socketMap
new Worker<OutboundMessageJob>(OUTBOUND_QUEUE, async (job) => {
  const { vendorId, remoteJid, content } = job.data;
  const sock = socketMap.get(vendorId);
  if (!sock) {
    console.error(`📤 No active socket for vendor ${vendorId} — will retry`);
    throw new Error(`No socket for vendor ${vendorId}`);
  }

  const isAuth = !!(sock.user || sock.authState?.creds?.me?.id);
  if (!isAuth) {
    console.error(`📤 [Vendor ${vendorId}] Socket not authenticated — will retry`);
    throw new Error(`Socket not authenticated for vendor ${vendorId}`);
  }

  const isConnected = (sock as any).ws?.readyState === 1;
  if (!isConnected) {
    console.error(`📤 [Vendor ${vendorId}] WebSocket connection is not OPEN (readyState: ${(sock as any).ws?.readyState}) — will retry`);
    throw new Error(`Socket connection not open for vendor ${vendorId}`);
  }

  let cleanJid = remoteJid;
  if (remoteJid.endsWith('@s.whatsapp.net')) {
    const num = remoteJid.split('@')[0].replace(/\D/g, '');
    cleanJid = `${num}@s.whatsapp.net`;
  }

  try {
    console.log(`📤 [Vendor ${vendorId}] Sending to ${cleanJid}: "${content.slice(0, 60)}..."`);
    await sock.sendMessage(cleanJid, { text: content });
    console.log(`✅ [Vendor ${vendorId}] Message delivered to ${cleanJid}`);
  } catch (err: any) {
    console.error(`❌ [Vendor ${vendorId}] sendMessage failed:`, err.message);
    throw err; // let BullMQ retry
  }
}, { connection: redisConnection, concurrency: 5 });

async function startAll() {
  const vendors = await prisma.vendor.findMany({ select: { id: true } });
  console.log(`🚀 Fleet starting sockets for ${vendors.length} vendor(s)`);
  await Promise.allSettled(vendors.map(v => startSock(v.id.toString())));
}

// Pick up new vendors registered after startup (polls every 60s)
setInterval(async () => {
  try {
    const vendors = await prisma.vendor.findMany({ select: { id: true } });
    for (const v of vendors) {
      const vid = v.id.toString();
      if (!socketMap.has(vid)) {
        console.log(`🆕 New vendor detected: ${vid} — starting socket`);
        startSock(vid).catch(console.error);
      }
    }
  } catch (err) {
    console.error('Fleet poll error:', err);
  }
}, 60_000);

startAll().catch(err => console.error('Fleet startup failed:', err));
