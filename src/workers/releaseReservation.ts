import { Worker } from 'bullmq';
import { RELEASE_QUEUE, type ReleaseReservationJob, outboundQueue } from '../shared/queue';
import { redisConnection } from '../shared/redis';
import { prisma } from '../shared/prisma/client';

const worker = new Worker<ReleaseReservationJob>(
  RELEASE_QUEUE,
  async (job) => {
    const { orderId, customerPhone, vendorId } = job.data;
    const oId = BigInt(orderId);

    const order = await prisma.order.findUnique({
      where: { id: oId },
      include: { items: true, reservation: true }
    });

    // Skip if already paid or already released
    if (!order || order.status !== 'PENDING') {
      console.log(`Release skipped: order ${orderId} status=${order?.status ?? 'not found'}`);
      return;
    }
    if (order.reservation?.released) {
      console.log(`Release skipped: reservation for order ${orderId} already released`);
      return;
    }

    // Release reserved stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { reservedStock: { decrement: item.quantity } }
      });
    }

    // Mark reservation released + cancel order
    if (order.reservation) {
      await prisma.softReservation.update({
        where: { id: order.reservation.id },
        data: { released: true }
      });
    }
    await prisma.order.update({ where: { id: oId }, data: { status: 'CANCELED' } });

    // Notify customer
    await outboundQueue.add(`cart-expired:${orderId}`, {
      vendorId,
      remoteJid: `${customerPhone}@s.whatsapp.net`,
      content: "Your cart reservation has expired and the items have been released. Feel free to start a new order anytime!"
    });

    console.log(`🔓 Released reservation for order ${orderId}`);
  },
  { connection: redisConnection as any }
);

console.log('👷 Release Reservation Worker started');
export default worker;
