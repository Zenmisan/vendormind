import Anthropic from "@anthropic-ai/sdk";
import { SessionContext } from './context.service';
import { prisma } from './prisma/client';
import { AIService } from './ai.service';
import { NombaService } from './nomba.service';
import { releaseQueue } from './queue';
import { redisConnection } from './redis';

export class AgentService {
  static async process(customerId: bigint, vendorId: bigint, text: string, context: SessionContext): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      ...context.recentMessages,
      { role: "user", content: text }
    ];

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { name: true, agentName: true, agentTone: true }
    });

    const agentName = vendor?.agentName || vendor?.name || "Sales Agent";
    const agentTone = vendor?.agentTone || "Friendly";

    const systemPrompt = `You are a helpful sales assistant named "${agentName}" for a vendor on WhatsApp.
Your tone should be ${agentTone}.
Summary of previous conversation: ${context.summary}

Your goal is to help customers browse products, add to cart, check delivery, and complete payment.
Always be polite and concise — this is WhatsApp. Use ₦ for prices.
When the customer is ready to pay, call generatePaymentLink. If they need human help, call handoff.`;

    const tools: Anthropic.Tool[] = [
      {
        name: "searchCatalog",
        description: "Search for products in the catalog",
        input_schema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Product name or category to search for" }
          },
          required: ["query"]
        }
      },
      {
        name: "checkDelivery",
        description: "Check delivery availability and cost based on user location",
        input_schema: {
          type: "object",
          properties: {
            location: { type: "string", description: "User location description or 'last_sent_location'" }
          },
          required: ["location"]
        }
      },
      {
        name: "addToCart",
        description: "Add a product to the user's shopping cart",
        input_schema: {
          type: "object",
          properties: {
            productName: { type: "string", description: "Name of the product to add" },
            quantity: { type: "integer", description: "Number of items to add", default: 1 }
          },
          required: ["productName"]
        }
      },
      {
        name: "searchDocuments",
        description: "Search vendor documents for policies, FAQs, or detailed product info",
        input_schema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Question or topic to look up" }
          },
          required: ["query"]
        }
      },
      {
        name: "generatePaymentLink",
        description: "Generate a Nomba payment link for the customer's current cart. Call this when the customer confirms they want to checkout.",
        input_schema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "handoff",
        description: "Transfer the conversation to a human agent when the customer needs help beyond your capabilities.",
        input_schema: {
          type: "object",
          properties: {
            reason: { type: "string", description: "Brief reason for the handoff" }
          },
          required: ["reason"]
        }
      }
    ];

    let currentMessages = [...messages];

    try {
      while (true) {
        const response = await AIService.generateResponse(systemPrompt, currentMessages, tools);

        if (!response.toolCalls || response.toolCalls.length === 0) {
          return response.content || "I'm not sure how to help with that.";
        }

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const tc of response.toolCalls) {
          const result = await this.executeTool(customerId, vendorId, tc.name, tc.input);
          toolResults.push({ type: "tool_result", tool_use_id: tc.id, content: result });
        }

        currentMessages.push({
          role: "assistant",
          content: [
            ...(response.content ? [{ type: 'text' as const, text: response.content }] : []),
            ...response.toolCalls.map(tc => ({
              type: 'tool_use' as const,
              id: tc.id,
              name: tc.name,
              input: tc.input
            }))
          ]
        });
        currentMessages.push({ role: "user", content: toolResults });
      }
    } catch (err: any) {
      console.error('Agent process failed:', err.message);
      return "I'm having a bit of trouble right now. Please try again in a moment!";
    }
  }

  private static async executeTool(customerId: bigint, vendorId: bigint, name: string, input: any): Promise<string> {
    console.log(`Executing tool: ${name}`, input);

    if (name === "searchCatalog") {
      const products = await prisma.product.findMany({
        where: { vendorId, name: { contains: input.query, mode: 'insensitive' } },
        take: 5
      });
      if (products.length === 0) return "No products found matching that query.";
      return JSON.stringify(products.map(p => ({
        name: p.name,
        price: `₦${p.price}`,
        description: p.description,
        available: p.stock - p.reservedStock
      })));
    }

    if (name === "addToCart") {
      const product = await prisma.product.findFirst({
        where: { vendorId, name: { contains: input.productName, mode: 'insensitive' } }
      });
      if (!product) return `Couldn't find a product named "${input.productName}".`;

      const qty = input.quantity || 1;
      const available = product.stock - product.reservedStock;
      if (qty > available) return `Only ${available} units of ${product.name} are available.`;

      const cart = await prisma.cart.upsert({
        where: { customerId },
        update: {},
        create: { customerId }
      });

      const existing = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId: product.id }
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + qty }
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId: cart.id, productId: product.id, quantity: qty }
        });
      }
      return `Added ${qty} × ${product.name} to your cart!`;
    }

    if (name === "checkDelivery") {
      if (input.location === 'last_sent_location') {
        return "Delivery to your location is available! Flat rate: ₦2,000.";
      }
      return "Please send your location pin so I can check delivery availability and cost.";
    }

    if (name === "searchDocuments") {
      // Try pgvector similarity search first, fall back to LIKE
      try {
        const embeddingRes = await AgentService.getQueryEmbedding(input.query);
        if (embeddingRes) {
          const vectorStr = `[${embeddingRes.join(',')}]`;
          const docs = await prisma.$queryRaw<Array<{ title: string | null; content: string }>>`
            SELECT title, content
            FROM documents
            WHERE vendor_id = ${vendorId}
              AND embedding IS NOT NULL
            ORDER BY embedding <=> ${vectorStr}::vector
            LIMIT 3
          `;
          if (docs.length > 0) {
            return docs.map(d => `[${d.title || 'General'}]\n${d.content}`).join('\n\n');
          }
        }
      } catch (_) {}

      // Fallback: keyword search
      const docs = await prisma.document.findMany({
        where: {
          vendorId,
          OR: [
            { content: { contains: input.query, mode: 'insensitive' } },
            { title: { contains: input.query, mode: 'insensitive' } }
          ]
        },
        take: 3
      });
      if (docs.length === 0) return "No documents found for that query.";
      return docs.map(d => `[${d.title || 'General'}]\n${d.content}`).join('\n\n');
    }

    if (name === "generatePaymentLink") {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { cart: { include: { items: { include: { product: true } } } } }
      });

      if (!customer) return "Could not find your account.";
      if (!customer.cart || customer.cart.items.length === 0) {
        return "Your cart is empty! Browse the catalog and add some items first.";
      }

      // Stock availability check
      for (const item of customer.cart.items) {
        const available = item.product.stock - item.product.reservedStock;
        if (item.quantity > available) {
          return `Sorry, only ${available} units of "${item.product.name}" are available right now.`;
        }
      }

      const total = customer.cart.items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity, 0
      );
      const reference = `VM-${Date.now()}-${customerId}`;

      // Create order
      const order = await prisma.order.create({
        data: {
          vendorId,
          customerId,
          total,
          status: 'PENDING',
          paymentLink: reference,
          items: {
            create: customer.cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price
            }))
          }
        }
      });

      // Reserve stock
      for (const item of customer.cart.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { reservedStock: { increment: item.quantity } }
        });
      }

      // Create soft reservation (30 min expiry)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await prisma.softReservation.create({ data: { orderId: order.id, expiresAt } });

      // Initialize Nomba checkout
      let paymentUrl = '';
      try {
        const result = await NombaService.createCheckoutOrder({
          amountNGN: total,
          orderReference: reference,
          customerEmail: `${customer.phoneNumber}@wa.vendormind.app`,
          customerId: customerId.toString(),
          metadata: {
            orderId: order.id.toString(),
            vendorId: vendorId.toString()
          }
        });
        paymentUrl = result.checkoutLink;
        await prisma.order.update({ where: { id: order.id }, data: { paymentLink: paymentUrl } });
      } catch (err: any) {
        paymentUrl = `[Payment unavailable: ${err.message}]`;
      }

      // Schedule stock release after 30 min
      await releaseQueue.add(
        `release:${order.id}`,
        { orderId: order.id.toString(), customerPhone: customer.phoneNumber, vendorId: vendorId.toString() },
        { delay: 30 * 60 * 1000, jobId: `release:${order.id}` }
      );

      // Clear cart
      await prisma.cartItem.deleteMany({ where: { cartId: customer.cart.id } });

      const itemsSummary = customer.cart.items
        .map(i => `• ${i.quantity}× ${i.product.name} — ₦${Number(i.product.price) * i.quantity}`)
        .join('\n');

      return `Order created!\n\n${itemsSummary}\n\nTotal: ₦${total.toFixed(2)}\n\nPay here (expires in 30 min):\n${paymentUrl}`;
    }

    if (name === "handoff") {
      const key = `handoff:${customerId}`;
      await redisConnection.set(key, '1', 'EX', 3600);
      console.log(`🤝 Handoff set for customer ${customerId}: ${input.reason}`);
      return "Handoff requested.";
    }

    return "Tool not implemented.";
  }

  private static async getQueryEmbedding(text: string): Promise<number[] | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: text, dimensions: 1536 })
      });
      if (!res.ok) return null;
      const body = await res.json() as any;
      return body.data[0].embedding as number[];
    } catch {
      return null;
    }
  }
}

export class MockAgentService {
  static async process(text: string, _context: SessionContext): Promise<string> {
    const input = text.toLowerCase();
    if (input.includes('browse') || input.includes('catalog') || input.includes('menu')) {
      return `Here is our catalog:\n• Premium Coffee Beans — ₦15,000\n• Green Tea Leaves — ₦10,000\n• Vanilla Syrup — ₦8,000\n\nWhat would you like to add to your cart?`;
    }
    if (input.includes('add') && input.includes('cart')) {
      return `Added to your cart! (Mock)`;
    }
    if (input.includes('delivery') || input.includes('location')) {
      return `We deliver to your area! Send your location pin to confirm shipping cost.`;
    }
    if (input.includes('policy') || input.includes('shipping') || input.includes('refund')) {
      return `Shipping: Flat rate ₦2,000 to Lagos & Abuja.\nRefunds: Available within 7 days if item is unopened.`;
    }
    return `I'm VendorMind AI. I can help you browse our catalog, add items to your cart, check delivery, or answer questions. Try "browse catalog"!`;
  }
}
