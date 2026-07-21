import { Worker } from 'bullmq';
import { INBOUND_QUEUE, type InboundMessageJob, outboundQueue } from '../shared/queue';
import { redisConnection } from '../shared/redis';
import { prisma } from '../shared/prisma/client';
import { ContextService } from '../shared/context.service';
import { AgentService, MockAgentService } from '../shared/agent.service';
import { BillingService } from '../shared/billing.service';
import { CircuitBreaker } from '../shared/utils/circuitBreaker';
import { MonnifyService } from '../shared/monnify.service';

const GRACEFUL_PAUSE_MSG = "I need to pause for a moment — let me get a team member for you! We'll be right with you.";

const worker = new Worker<InboundMessageJob>(
  INBOUND_QUEUE,
  async (job) => {
    try {
      const { vendorId, customerPhone, customerName, content, type, location } = job.data;
      const vId = BigInt(vendorId);

      console.log(`Processing inbound message from ${customerPhone} for vendor ${vendorId}`);

      // 1. Circuit breaker: customer throttling
      const throttled = await CircuitBreaker.isThrottled(vId, customerPhone);
      if (throttled) {
        console.warn(`🛑 Customer ${customerPhone} throttled for vendor ${vendorId}`);
        return;
      }

      // 1.1 Onboarding Gate: block if catalog has <80% products embedded (only if OpenAI key is configured)
      const hasOpenAI = !!(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('...'));
      if (hasOpenAI) {
        const totalProducts = await prisma.product.count({ where: { vendorId: vId } });
        if (totalProducts > 0 && vId !== 1n) {
          const embeddedResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*)::bigint as count
            FROM products
            WHERE "vendorId" = ${vId}
              AND embedding IS NOT NULL
          `;
          const embedded = Number(embeddedResult[0]?.count || 0);
          const progress = (embedded / totalProducts) * 100;
          if (progress < 80.0) {
            console.warn(`🛑 Vendor ${vendorId} blocked by Onboarding Gate: ${progress.toFixed(1)}% embedded`);
            await outboundQueue.add(`catalog-indexing-block:${job.id}`, {
              vendorId,
              remoteJid: `${customerPhone}@s.whatsapp.net`,
              content: "We are currently preparing our store catalog for the AI assistant. Please try again in a few minutes!"
            });
            return;
          }
        }
      }

      // 2. Wallet check
      const billing = await BillingService.canProcess(vId);
      if (!billing.allowed) {
        console.warn(`🛑 Vendor ${vendorId} hard-blocked: ${billing.reason} (balance: ${billing.balance})`);
        await outboundQueue.add(`billing-block:${job.id}`, {
          vendorId,
          remoteJid: `${customerPhone}@s.whatsapp.net`,
          content: GRACEFUL_PAUSE_MSG
        });
        return;
      }

      // 3. Overdraft: allow processing but send graceful pause & set handoff
      if (billing.overdraft) {
        console.warn(`⚠️ Vendor ${vendorId} in overdraft (balance: ${billing.balance})`);
        await outboundQueue.add(`overdraft-pause:${job.id}`, {
          vendorId,
          remoteJid: `${customerPhone}@s.whatsapp.net`,
          content: GRACEFUL_PAUSE_MSG
        });
        // Find customer to set handoff flag
        const overdraftCustomer = await prisma.customer.findUnique({
          where: { vendorId_phoneNumber: { vendorId: vId, phoneNumber: customerPhone } }
        });
        if (overdraftCustomer) {
          await redisConnection.set(`handoff:${overdraftCustomer.id}`, '1', 'EX', 3600);
        }
        return;
      }

      // 4. Identify / create customer — upsert name from WhatsApp pushName when available
      const resolvedName = customerName || 'WhatsApp Customer';
      let customer = await prisma.customer.findUnique({
        where: { vendorId_phoneNumber: { vendorId: vId, phoneNumber: customerPhone } }
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { vendorId: vId, phoneNumber: customerPhone, name: resolvedName }
        });
      } else if (customerName && (customer.name === 'WhatsApp Customer' || !customer.name)) {
        // Update name if we now have a real name and previously didn't
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { name: customerName }
        });
      }

      // 4.1. Auto-generate permanent reserved bank account if none exists
      if (!customer.reservedAccountNumber && process.env.MONNIFY_API_KEY) {
        try {
          const ref = `ACC-${customer.id}-${Date.now()}`;
          const accInfo = await MonnifyService.createReservedAccount({
            accountReference: ref,
            accountName: `VendorMind: ${customer.name || 'Customer'}`,
            customerEmail: `${customerPhone}@vendormind.app`,
            customerName: customer.name || 'WhatsApp Customer'
          });
          if (accInfo) {
            customer = await prisma.customer.update({
              where: { id: customer.id },
              data: {
                reservedBankName: accInfo.bankName,
                reservedAccountNumber: accInfo.accountNumber,
                reservedAccountReference: ref
              }
            });
            console.log(`🏦 Generated Monnify Reserved Account for Customer ${customer.id}: ${accInfo.bankName} ${accInfo.accountNumber}`);
          }
        } catch (err: any) {
          console.error(`⚠️ Failed to generate reserved account for Customer ${customer.id}:`, err.message);
        }
      }

      // 5. Check handoff flag — if set, skip bot and wait for human
      const handoffKey = `handoff:${customer.id}`;
      const handoffActive = await redisConnection.get(handoffKey);
      if (handoffActive) {
        console.log(`🤝 Handoff active for customer ${customer.id} — skipping bot`);
        return;
      }

      // 6. Save user message into context immediately so dashboard updates in real-time
      let userMsgText = '';
      if (type === 'text' && content) userMsgText = content;
      else if (type === 'location' && location) userMsgText = `[User sent precise location: Lat ${location.lat}, Lng ${location.lng}]`;
      else userMsgText = '[Media message]';

      if (userMsgText) {
        await ContextService.updateContext(customer.id, { role: 'user', content: userMsgText });
      }

      // Reload context including newly saved user message
      const context = await ContextService.getContext(customer.id);

      // 7. Route by message type & run agent
      const useLLM = !!(
        (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('...')) ||
        (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('...')) ||
        (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('...'))
      );
      let responseText = '';

      if (type === 'text' && content) {
        responseText = useLLM
          ? await AgentService.process(customer.id, vId, content, context)
          : await MockAgentService.process(content, context);
      } else if (type === 'location' && location) {
        responseText = useLLM
          ? await AgentService.process(customer.id, vId, userMsgText, context)
          : await MockAgentService.process(userMsgText, context);
      } else {
        responseText = "I can only process text and location messages right now.";
      }

      if (responseText === '__STAND_DOWN__') {
        console.log(`😇 Stand-down triggered for "${userMsgText}". Message saved to context, skipping bot reply.`);
        return;
      }

      // 8. Update context with assistant response
      await ContextService.updateContext(customer.id, { role: 'assistant', content: responseText });

      // 9. Deduct billing
      await BillingService.deduct(vId, 'INBOUND_MESSAGE');
      await BillingService.deduct(vId, useLLM ? 'LLM_SONNET' : 'MOCK_AGENT');
      await BillingService.deduct(vId, 'OUTBOUND_MESSAGE');

      // 10. Send reply
      console.log(`✅ Enqueueing outbound reply to ${customerPhone}`);
      await outboundQueue.add(`reply:${job.id}`, {
        vendorId,
        remoteJid: `${customerPhone}@s.whatsapp.net`,
        content: responseText
      });
    } catch (error: any) {
      console.error('❌ ERROR in Inbound Processor:', error);
      throw error;
    }
  },
  { connection: redisConnection as any }
);

console.log('👷 Inbound Processor started');
export default worker;
