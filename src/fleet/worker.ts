import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  type WAMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { usePrismaAuthState } from './auth';
import { pino } from 'pino';
import Groq from 'groq-sdk';
import { Worker } from 'bullmq';
import { inboundQueue, OUTBOUND_QUEUE, type OutboundMessageJob, type InboundMessageJob } from '../shared/queue';
import { redisConnection } from '../shared/redis';
import { prisma } from '../shared/prisma/client';

const logger = pino({ level: 'silent' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// socketMap tracks active sockets per vendor so we never double-start
const socketMap = new Map<string, ReturnType<typeof makeWASocket>>();

// Track when each socket last disconnected and reconnected.
// disconnectedAtMap: timestamp the socket went offline (used as cutoff for stale messages)
// connectedAtMap: timestamp the socket came back online
const disconnectedAtMap = new Map<string, number>();
const connectedAtMap = new Map<string, number>();

function extractMessageText(message: WAMessage['message']): string | null {
  if (!message) return null;
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.ephemeralMessage?.message) return extractMessageText(message.ephemeralMessage.message);
  if (message.viewOnceMessage?.message) return extractMessageText(message.viewOnceMessage.message);
  if (message.viewOnceMessageV2?.message) return extractMessageText(message.viewOnceMessageV2.message);
  if (message.documentWithCaptionMessage?.message) return extractMessageText(message.documentWithCaptionMessage.message);
  return null;
}

async function transcribeAudio(msg: WAMessage): Promise<string | null> {
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

// Mutex map to prevent duplicate concurrent reconnection attempts per vendor
const reconnectingMap = new Map<string, boolean>();

async function startSock(vendorId: string) {
  if (reconnectingMap.get(vendorId)) {
    console.log(`[Vendor ${vendorId}] Connection attempt already in progress — skipping duplicate startSock`);
    return;
  }
  reconnectingMap.set(vendorId, true);

  let sock: ReturnType<typeof makeWASocket> | null = null;

  try {
    if (socketMap.has(vendorId)) {
      const activeSock = socketMap.get(vendorId);
      if ((activeSock as any)?.ws?.readyState === 1 && activeSock?.user) {
        reconnectingMap.delete(vendorId);
        return activeSock;
      }
      socketMap.delete(vendorId);
      try { (activeSock as any)?.ws?.close(); } catch {}
      try { activeSock?.end(undefined); } catch {}
    }
    let reconnectCount = 0;
    const { state, saveCreds } = await usePrismaAuthState(vendorId);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const vId = BigInt(vendorId);

    console.log(`[Vendor ${vendorId}] using WA v${version.join('.')}, isLatest: ${isLatest}`);

    sock = makeWASocket({
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
      const pairingPhone = await redisConnection.get(`pairing_phone:${vendorId}`);
      if (pairingPhone && !state.creds.registered) {
        try {
          const cleanPhone = pairingPhone.replace(/\D/g, '');
          console.log(`📱 [Vendor ${vendorId}] Requesting pairing code for ${cleanPhone}...`);
          if (sock) {
            const code = await sock.requestPairingCode(cleanPhone);
            await redisConnection.del(`pairing_phone:${vendorId}`);
            console.log(`📱 [Vendor ${vendorId}] Pairing code generated: ${code}`);
            await prisma.whatsAppSession.upsert({
              where: { sessionId: `${vendorId}:qr` },
              update: { data: { pairingCode: code }, updatedAt: new Date() },
              create: { vendorId: vId, sessionId: `${vendorId}:qr`, data: { pairingCode: code } }
            });
          }
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
      disconnectedAtMap.set(vendorId, Date.now());
      connectedAtMap.delete(vendorId);
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

      // Always mark as disconnected so the portal reflects reality immediately
      await prisma.whatsAppSession.upsert({
        where: { sessionId: `${vendorId}:qr` },
        update: { data: { connected: false }, updatedAt: new Date() },
        create: { vendorId: vId, sessionId: `${vendorId}:qr`, data: { connected: false } },
      }).catch(() => {});

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        console.log(`[Vendor ${vendorId}] Logged out — clearing session`);
        reconnectingMap.delete(vendorId);
        await prisma.whatsAppSession.deleteMany({ where: { vendorId: vId } }).catch(() => {});
      } else if (statusCode !== 440) {
        reconnectCount++;
        const delay = reconnectCount === 1 ? 1000 : Math.min(2000 * (2 ** Math.min(reconnectCount, 4)), 30000);
        console.log(`[Vendor ${vendorId}] Disconnected (${statusCode}) — reconnecting in ${delay/1000}s (attempt ${reconnectCount})`);
        setTimeout(() => {
          reconnectingMap.delete(vendorId);
          startSock(vendorId);
        }, delay);
      } else {
        reconnectingMap.delete(vendorId);
      }
    } else if (connection === 'open') {
      reconnectingMap.delete(vendorId);
      connectedAtMap.set(vendorId, Date.now());
      console.log(`🚀 [Vendor ${vendorId}] WhatsApp connected`);
      await prisma.whatsAppSession.upsert({
        where: { sessionId: `${vendorId}:qr` },
        update: { data: { connected: true }, updatedAt: new Date() },
        create: { vendorId: vId, sessionId: `${vendorId}:qr`, data: { connected: true } },
      }).catch(() => {});
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      if (msg.key.fromMe || !msg.message) continue;

      const remoteJid = msg.key.remoteJid || '';

      // Only handle personal DMs — skip groups, broadcasts, status, newsletters
      if (!remoteJid.endsWith('@s.whatsapp.net')) continue;

      const customerPhone = (remoteJid.split('@')[0] || '').replace(/\D/g, '');
      const customerName = msg.pushName?.trim() || undefined;
      const messageId = msg.key.id || '';
      const ts = Number(msg.messageTimestamp) * 1000 || Date.now();

      // Skip messages that predate the last disconnect — these are old history WhatsApp
      // re-delivers on reconnect. Messages sent *during* downtime are newer than
      // disconnectedAt and must be processed so customers get replies.
      // On first-ever connect (no disconnectedAt), fall back to connectedAt - 30s.
      const disconnectedAt = disconnectedAtMap.get(vendorId);
      const connectedAt = connectedAtMap.get(vendorId) ?? 0;
      const cutoff = disconnectedAt ? disconnectedAt - 30_000 : connectedAt - 30_000;
      if (cutoff > 0 && ts < cutoff) {
        console.log(`⏭️ [Vendor ${vendorId}] Skipping pre-disconnect stale msg from ${customerPhone} (msg: ${new Date(ts).toISOString()}, cutoff: ${new Date(cutoff).toISOString()})`);
        continue;
      }

      // Redis dedup: prevent double-processing if same messageId arrives twice
      const dedupKey = `msg_seen:${vendorId}:${messageId}`;
      const alreadySeen = await redisConnection.set(dedupKey, '1', 'EX', 86400, 'NX');
      if (!alreadySeen) {
        console.log(`⏭️ [Vendor ${vendorId}] Duplicate msg ${messageId} from ${customerPhone} — skipping`);
        continue;
      }

      let jobData: InboundMessageJob | null = null;

      const text = extractMessageText(msg.message);
      if (text) {
        jobData = { vendorId, customerPhone, customerName: customerName ?? '', messageId, type: 'text', content: text, timestamp: ts };
      } else if (msg.message.locationMessage) {
        jobData = {
          vendorId, customerPhone, customerName: customerName ?? '', messageId,
          type: 'location',
          location: {
            lat: msg.message.locationMessage.degreesLatitude ?? 0,
            lng: msg.message.locationMessage.degreesLongitude ?? 0
          },
          timestamp: ts
        };
      } else if (msg.message.audioMessage) {
        console.log(`🎙️ [Vendor ${vendorId}] Voice note from ${customerPhone} — transcribing...`);
        const transcription = await transcribeAudio(msg);
        if (transcription) {
          jobData = { vendorId, customerPhone, customerName: customerName ?? '', messageId, type: 'text', content: transcription, timestamp: ts };
          console.log(`🎙️ Transcribed: "${transcription}"`);
        } else {
          jobData = { vendorId, customerPhone, customerName: customerName ?? '', messageId, type: 'text', content: "[Voice note received but could not be transcribed. Please type your message.]", timestamp: ts };
        }
      }

      if (jobData) {
        console.log(`📥 [Vendor ${vendorId}] Enqueuing message from ${customerPhone}`);
        await inboundQueue.add(`${customerPhone}:${messageId}`, jobData, { jobId: messageId });
      }
    }
  });

  } catch (err: any) {
    console.error(`[Vendor ${vendorId}] Error in startSock:`, err.message);
    reconnectingMap.delete(vendorId);
  }

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

  let cleanJid = remoteJid || '';
  if (cleanJid.endsWith('@s.whatsapp.net')) {
    const parts = cleanJid.split('@');
    const num = (parts[0] || '').replace(/\D/g, '');
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
}, { connection: redisConnection as any, concurrency: 5 });

async function startAll() {
  try {
    const vendors = await prisma.vendor.findMany({ select: { id: true } });
    console.log(`🚀 Fleet starting sockets for ${vendors.length} vendor(s)`);
    await Promise.allSettled(vendors.map(v => startSock(v.id.toString())));
  } catch (err: any) {
    console.error('⚠️ Fleet startup database query failed, retrying in 5s:', err.message);
    setTimeout(startAll, 5000);
  }
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

// Listen for control commands (e.g. restart socket for fresh QR/pairing code)
const fleetSub = redisConnection.duplicate();
fleetSub.subscribe('fleet_control');
fleetSub.on('message', async (channel, message) => {
  if (channel === 'fleet_control') {
    try {
      const payload = JSON.parse(message);
      if (payload.action === 'restart_socket' && payload.vendorId) {
        const vid = payload.vendorId.toString();
        console.log(`🔄 [Vendor ${vid}] Command received: restart_socket — re-initializing Baileys socket...`);
        const existing = socketMap.get(vid);
        if (existing) {
          socketMap.delete(vid);
          try { (existing as any)?.ws?.close(); } catch {}
          try { existing?.end(undefined); } catch {}
        }
        await startSock(vid);
      }
    } catch (err) {
      console.error('fleet_control message error:', err);
    }
  }
});

startAll().catch(err => console.error('Fleet startup failed:', err));
