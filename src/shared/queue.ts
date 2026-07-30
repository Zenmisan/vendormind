import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const INBOUND_QUEUE = 'inbound-messages';
export const OUTBOUND_QUEUE = 'outbound-messages';
export const RELEASE_QUEUE = 'release-reservation';
export const EMBED_QUEUE = 'embed-product';

export interface ReleaseReservationJob {
  orderId: string;
  customerPhone: string;
  vendorId: string;
}

export interface EmbedProductJob {
  productId: string;
  text: string;
}

const defaultOptions = {
  connection: redisConnection as any,
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
export const releaseQueue = new Queue(RELEASE_QUEUE, defaultOptions);
export const embedQueue = new Queue(EMBED_QUEUE, defaultOptions);

export interface InboundMessageJob {
  vendorId: string;
  customerPhone: string;
  customerName?: string;
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
