import { Worker } from 'bullmq';
import { INBOUND_QUEUE, InboundMessageJob, outboundQueue } from '../shared/queue';
import { redisConnection } from '../shared/redis';
import { prisma } from '../shared/prisma/client';
import { ContextService } from '../shared/context.service';
import { AgentService, MockAgentService } from '../shared/agent.service';
import { BillingService } from '../shared/billing.service';
import { CircuitBreaker } from '../shared/utils/circuitBreaker';

const worker = new Worker<InboundMessageJob>(
  INBOUND_QUEUE,
  async (job) => {
    try {
      const { vendorId, customerPhone, content, type, location } = job.data;
      const vId = BigInt(vendorId);

      console.log(`Processing inbound message from ${customerPhone} for vendor ${vendorId}`);

      // 1. Economic Defense: Circuit Breaker (Customer Throttling)
      const throttled = await CircuitBreaker.isThrottled(vId, customerPhone);
      if (throttled) {
        console.warn(`🛑 Customer ${customerPhone} throttled for vendor ${vendorId}`);
        return; 
      }

      // 2. Economic Defense: Wallet Balance Check
      const billing = await BillingService.canProcess(vId);
      if (!billing.allowed) {
        console.warn(`🛑 Vendor ${vendorId} blocked: ${billing.reason} (Balance: ${billing.balance})`);
        await outboundQueue.add(`billing-alert:${job.id}`, {
          vendorId,
          remoteJid: `${customerPhone}@s.whatsapp.net`,
          content: "I'm sorry, my services are currently offline. Please try again later."
        });
        return;
      }

      // 3. Identify/Create Customer
      let customer = await prisma.customer.findUnique({
        where: { vendorId_phoneNumber: { vendorId: vId, phoneNumber: customerPhone } }
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            vendorId: vId,
            phoneNumber: customerPhone,
            name: 'WhatsApp Customer'
          }
        });
      }

      // 2. Get current context
      const context = await ContextService.getContext(customer.id);

      // 3. Handle message types & Call Agent
      let responseText = '';
      const useLLM = process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-');

      if (type === 'text' && content) {
        if (useLLM) {
          responseText = await AgentService.process(customer.id, content, context);
        } else {
          responseText = await MockAgentService.process(content, context);
        }
        await ContextService.updateContext(customer.id, { role: 'user', content });
      } else if (type === 'location' && location) {
        const locationNote = `[User sent precise location: Lat ${location.lat}, Lng ${location.lng}]`;
        if (useLLM) {
          responseText = await AgentService.process(customer.id, locationNote, context);
        } else {
          responseText = await MockAgentService.process(locationNote, context);
        }
        await ContextService.updateContext(customer.id, { role: 'user', content: locationNote });
      } else if (type === 'audio') {
        responseText = "I received your voice note! I'm still learning how to listen, but I'll be able to process these soon.";
      } else {
        responseText = "I'm sorry, I can only process text and location messages right now.";
      }

      // 4. Update context with assistant response
      await ContextService.updateContext(customer.id, { role: 'assistant', content: responseText });

      // 5. Economic Defense: Billing Deduction
      await BillingService.deduct(vId, 'INBOUND_MESSAGE');
      if (useLLM) {
        await BillingService.deduct(vId, 'LLM_SONNET');
      } else {
        await BillingService.deduct(vId, 'MOCK_AGENT');
      }
      await BillingService.deduct(vId, 'OUTBOUND_MESSAGE');

      // 6. Enqueue Outbound
      console.log(`✅ Enqueueing outbound reply to ${customerPhone}`);
      await outboundQueue.add(`reply:${job.id}`, {
        vendorId,
        remoteJid: `${customerPhone}@s.whatsapp.net`,
        content: responseText
      });
    } catch (error: any) {
      console.error('❌ ERROR in Inbound Processor:', error);
      throw error; // Re-throw to let BullMQ handle retries if needed
    }
  },
  { connection: redisConnection }
);

console.log('👷 Inbound Processor started');

export default worker;
