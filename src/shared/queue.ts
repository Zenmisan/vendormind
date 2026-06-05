import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const INBOUND_QUEUE = 'inbound-messages';
export const OUTBOUND_QUEUE = 'outbound-messages';

const defaultOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
};

export const inboundQueue = new Queue(INBOUND_QUEUE, defaultOptions);
export const outboundQueue = new Queue(OUTBOUND_QUEUE, defaultOptions);

export interface InboundMessageJob {
  vendorId: string;
  customerPhone: string;
  messageId: string;
  type: 'text' | 'location' | 'audio';
  content?: string;
  location?: {
    lat: number;
    lng: number;
  };
  timestamp: number;
}

export interface OutboundMessageJob {
  vendorId: string;
  remoteJid: string;
  content: string; // Simplification for now, can be more complex (buttons, etc)
}
