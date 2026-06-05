import { redisConnection } from '../redis';

export class CircuitBreaker {
  static LIMIT = 10;
  static WINDOW_SECONDS = 60;

  static async isThrottled(vendorId: bigint, customerPhone: string): Promise<boolean> {
    const key = `cb:${vendorId}:${customerPhone}`;
    
    const current = await redisConnection.incr(key);
    
    if (current === 1) {
      await redisConnection.expire(key, this.WINDOW_SECONDS);
    }

    if (current > this.LIMIT) {
      return true;
    }

    return false;
  }
}
