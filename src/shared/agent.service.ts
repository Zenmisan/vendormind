import Anthropic from "@anthropic-ai/sdk";
import type { SessionContext } from './context.service';
import { prisma } from './prisma/client';
import { AIService } from './ai.service';
import { BmoniService } from './bmoni.service';
import { releaseQueue } from './queue';
import { redisConnection } from './redis';

export class AgentService {
  static async process(customerId: bigint, vendorId: bigint, text: string, context: SessionContext): Promise<string> {
    const customerRecord = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { cart: { include: { items: true } } }
    });
    const hasCartItems = (customerRecord?.cart?.items?.length ?? 0) > 0;

    // Smart Filter: Classify initial message to filter out casual/personal chit-chat, but continue if conversation is ongoing
    const isOngoing = context.recentMessages.length > 1;
    if (!isOngoing && !hasCartItems) {
      const isBusiness = await this.isBusinessConversation(text);
      if (!isBusiness) {
        console.log(`🤖 Standing down on initial personal/casual message for customer ${customerId}: "${text}"`);
        return '__STAND_DOWN__';
      }
    }

    const lastRecent = context.recentMessages[context.recentMessages.length - 1];
    const isLastMsgUserText = lastRecent && lastRecent.role === 'user' && (typeof lastRecent.content === 'string' ? lastRecent.content : JSON.stringify(lastRecent.content)) === text;

    const messages: Anthropic.MessageParam[] = isLastMsgUserText
      ? [...context.recentMessages]
      : [...context.recentMessages, { role: "user", content: text }];

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

BMONI Smart Wallet Payments:
Payments are processed instantly using BMONI on-chain CNGN smart wallets.
- When customer says they want to checkout or pay, call checkCustomerBalance or checkCustomerWallet first.
- If customer has sufficient CNGN balance, ask for confirmation and call executePayment to complete the purchase instantly in-chat.
- If balance is insufficient, call getFundingInstructions to give them their dedicated virtual bank account number (Wema Bank) to top up.
- If they need human help, call handoff.`;

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
        name: "checkCustomerWallet",
        description: "Check or provision the customer's BMONI CNGN smart wallet balance",
        input_schema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "checkCustomerBalance",
        description: "Check if customer's CNGN balance covers their current cart total",
        input_schema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "getFundingInstructions",
        description: "Get customer's dedicated NGN virtual bank account number for top-ups when balance is insufficient",
        input_schema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "executePayment",
        description: "Execute instant in-chat CNGN transfer from customer wallet to vendor wallet to complete checkout",
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
      // 1. Try pgvector similarity search if query embedding succeeds
      try {
        const queryEmbedding = await AgentService.getQueryEmbedding(input.query);
        if (queryEmbedding) {
          const vectorStr = `[${queryEmbedding.join(',')}]`;
          const simProducts = await prisma.$queryRaw<Array<{ id: bigint; name: string; price: any; description: string | null; stock: number; reservedStock: number }>>`
            SELECT id, name, price, description, stock, "reservedStock"
            FROM products
            WHERE "vendorId" = ${vendorId}
              AND embedding IS NOT NULL
            ORDER BY embedding <=> ${vectorStr}::vector
            LIMIT 5
          `;
          if (simProducts.length > 0) {
            return JSON.stringify(simProducts.map(p => ({
              name: p.name,
              price: `₦${p.price}`,
              description: p.description,
              available: p.stock - p.reservedStock
            })));
          }
        }
      } catch (err: any) {
        console.warn("pgvector search notice, falling back to ILIKE:", err.message);
      }

      // 2. Fallback: ILIKE keyword search across name and description
      const products = await prisma.product.findMany({
        where: {
          vendorId,
          OR: [
            { name: { contains: input.query, mode: 'insensitive' } },
            { description: { contains: input.query, mode: 'insensitive' } }
          ]
        },
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
            WHERE "vendorId" = ${vendorId}
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

    if (name === "checkCustomerWallet" || name === "checkCustomerBalance") {
      let customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { cart: { include: { items: { include: { product: true } } } } }
      });

      if (!customer) return "Could not find customer record.";

      // Ensure customer has BMONI user & wallet provisioned
      if (!customer.bmoniUserId || !customer.bmoniSmartWalletId) {
        try {
          const bmoniStack = await BmoniService.provisionUserStack(
            customer.name || `Customer ${customer.phoneNumber}`,
            `${customer.phoneNumber.replace(/[^\d]/g, '')}@wa.vendormind.app`,
            customer.phoneNumber
          );
          customer = await prisma.customer.update({
            where: { id: customerId },
            data: {
              bmoniUserId: bmoniStack.bmoniUserId,
              bmoniSmartWalletId: bmoniStack.smartWalletId,
              bmoniSmartWalletAddress: bmoniStack.smartWalletAddress,
              bmoniNgnRailActive: true,
              bmoniDepositAccountNumber: bmoniStack.depositAccountNumber,
              bmoniDepositBankName: bmoniStack.depositBankName,
            },
            include: { cart: { include: { items: { include: { product: true } } } } }
          });
        } catch (err: any) {
          console.error("Auto-provisioning BMONI wallet failed:", err.message);
        }
      }

      const cartTotal = (customer.cart?.items || []).reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity, 0
      );

      const balances = customer.bmoniUserId
        ? await BmoniService.getWalletBalances(customer.bmoniUserId)
        : [{ currency: "CNGN", balance: "0" }];

      const cngnBal = Number(balances.find(b => b.currency === "CNGN")?.balance || "0");

      if (name === "checkCustomerBalance") {
        const sufficient = cngnBal >= cartTotal;
        return JSON.stringify({
          cartTotal: `₦${cartTotal.toFixed(2)}`,
          cngnBalance: `₦${cngnBal.toFixed(2)}`,
          isSufficient: sufficient,
          depositAccount: customer.bmoniDepositAccountNumber || "Pending",
          depositBank: customer.bmoniDepositBankName || "Wema Bank",
        });
      }

      return `Your BMONI CNGN Wallet balance is ₦${cngnBal.toFixed(2)}.`;
    }

    if (name === "getFundingInstructions") {
      let customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer?.bmoniUserId) {
        return "Your BMONI wallet is being set up. Please try again in a few seconds.";
      }

      const accNumber = customer.bmoniDepositAccountNumber || "BMONI-PENDING";
      const bankName = customer.bmoniDepositBankName || "Wema Bank / BMONI";

      return `To fund your BMONI wallet, send your transfer to your dedicated shop account:\n\n🏦 Bank: ${bankName}\n🔢 Account: ${accNumber}\n👤 Name: VendorMind / ${customer.name || 'Customer'}\n\nOnce funded, type 'checkout' to complete your order!`;
    }

    if (name === "executePayment") {
      let customer = await prisma.customer.findUnique({
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

      // Fetch vendor BMONI wallet
      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
      const vendorWalletAddress = vendor?.bmoniSmartWalletAddress || "0x0000000000000000000000000000000000000000";

      // Execute CNGN transfer
      let txRef = `bmoni_tx_${Date.now()}`;
      if (customer.bmoniUserId && customer.bmoniSmartWalletId) {
        const txResult = await BmoniService.transferCngn(
          customer.bmoniUserId,
          customer.bmoniSmartWalletId,
          vendorWalletAddress,
          total.toFixed(2)
        );
        txRef = txResult.transactionRef;
      }

      // Execute Order Creation, Atomic Stock Decrement, and Cart Clear in single transaction
      const cartItems = customer.cart.items;
      const cartId = customer.cart.id;

      const order = await prisma.$transaction(async (tx) => {
        // 1. Verify and atomic decrement stock for each item
        for (const item of cartItems) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product || (product.stock - product.reservedStock) < item.quantity) {
            throw new Error(`Insufficient stock for product "${item.product.name}"`);
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }

        // 2. Create order in PAID state
        const newOrder = await tx.order.create({
          data: {
            vendorId,
            customerId,
            total,
            status: 'PAID',
            paymentLink: txRef,
            items: {
              create: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price
              }))
            }
          }
        });

        // 3. Clear cart
        await tx.cartItem.deleteMany({ where: { cartId } });

        return newOrder;
      }).catch((err: any) => {
        console.error("Order transaction failed:", err.message);
        return null;
      });

      if (!order) {
        return "Order processing failed due to insufficient stock or concurrent update. Please try again.";
      }

      const itemsSummary = cartItems
        .map(i => `• ${i.quantity}× ${i.product.name} — ₦${Number(i.product.price) * i.quantity}`)
        .join('\n');

      return `✅ Payment Confirmed via BMONI Smart Wallet!\n\nOrder #${order.id}\n${itemsSummary}\n\nTotal Paid: ₦${total.toFixed(2)}\nTx Ref: ${txRef}\n\nThank you for your order!`;
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

  static async isBusinessConversation(text: string): Promise<boolean> {
    const systemPrompt = `You are a conversation classifier for a WhatsApp business sales assistant.
Your task is to determine if the user's message is a business/commerce inquiry (e.g. catalog browsing, price request, shipping, ordering, checkouts, store policies) OR a standard business greeting (e.g., "hi", "hello", "good morning", "is anyone there?").
Otherwise, if it is a personal/casual chat or general chit-chat unrelated to shopping/business (e.g., "what are you doing tonight?", "are you free?", "wanna hang out?", "how was your day?", "hey buddy"), classify it as PERSONAL.

Respond with exactly one word:
"BUSINESS" - if it is a business/commerce query or standard business greeting.
"PERSONAL" - if it is personal chat or casual chit-chat unrelated to the business.`;

    try {
      const response = await AIService.generateResponse(
        systemPrompt,
        [{ role: "user", content: text }],
        []
      );
      const verdict = response.content.trim().toUpperCase();
      console.log(`🔍 Conversation classification for "${text}": ${verdict}`);
      return verdict !== 'PERSONAL';
    } catch (err) {
      console.error("Classifier failed, defaulting to BUSINESS:", err);
      return true;
    }
  }
}

export class MockAgentService {
  static async process(text: string, _context: SessionContext): Promise<string> {
    const input = text.toLowerCase();
    
    // Check if personal/casual chit-chat
    const personalPhrases = [
      "doing tonight", "wanna hang", "hang out", "are you free", "how was your day", "how is your day",
      "what's up", "sup buddy", "hey buddy", "how are you doing", "how are you"
    ];
    if (personalPhrases.some(p => input.includes(p))) {
      return '__STAND_DOWN__';
    }

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
