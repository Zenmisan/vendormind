import Anthropic from "@anthropic-ai/sdk";
import { SessionContext } from './context.service';
import { prisma } from './prisma/client';
import { AIService } from './ai.service';

export class AgentService {
  static async process(customerId: bigint, text: string, context: SessionContext): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      ...context.recentMessages,
      { role: "user", content: text }
    ];

    const systemPrompt = `You are a helpful sales assistant for a vendor on WhatsApp.
Current Vendor Context: Demo Vendor
Summary of previous conversation: ${context.summary}

Your goal is to help customers browse products, add to cart, and check delivery.
Always be polite and concise as this is WhatsApp.`;

    const tools: any[] = [
      {
        name: "searchCatalog",
        description: "Search for products in the catalog",
        input_schema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The product name or category to search for" }
          }
        }
      },
      {
        name: "checkDelivery",
        description: "Check if delivery is available and what the cost is based on user location",
        input_schema: {
          type: "object",
          properties: {
            location: { type: "string", description: "The user's location or 'last_sent_location'" }
          }
        }
      },
      {
        name: "addToCart",
        description: "Add a product to the user's shopping cart",
        input_schema: {
          type: "object",
          properties: {
            productName: { type: "string", description: "The name of the product to add" },
            quantity: { type: "integer", description: "The number of items to add", default: 1 }
          },
          required: ["productName"]
        }
      },
      {
        name: "searchDocuments",
        description: "Search for specific information in the vendor's uploaded documents (policies, detailed descriptions, FAQ)",
        input_schema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The specific question or topic to look up" }
          }
        }
      }
    ];

    let currentMessages = [...messages];

    try {
      while (true) {
        const response = await AIService.generateResponse(systemPrompt, currentMessages, tools);

        // Convert response to Anthropic format for context tracking if needed, 
        // but for now we just return the text to the user.
        
        if (!response.toolCalls) {
          return response.content || "I'm not sure how to help with that.";
        }

        // Handle tool calls
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const tc of response.toolCalls) {
          const result = await this.executeTool(customerId, tc.name, tc.input);
          toolResults.push({
            type: "tool_result",
            tool_use_id: tc.id,
            content: result
          });
        }

        // Add to history and loop
        currentMessages.push({ 
          role: "assistant", 
          content: [
            { type: 'text', text: response.content },
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
      return "I'm having a bit of trouble thinking right now. Please try again later!";
    }
  }

  private static async executeTool(customerId: bigint, name: string, input: any): Promise<string> {
    console.log(`Executing tool: ${name}`, input);
    
    if (name === "searchCatalog") {
      const products = await prisma.product.findMany({
        where: { name: { contains: input.query, mode: 'insensitive' } },
        take: 5
      });
      if (products.length === 0) return "No products found matching that query.";
      return JSON.stringify(products.map(p => ({ name: p.name, price: p.price, description: p.description })));
    }

    if (name === "addToCart") {
      const product = await prisma.product.findFirst({
        where: { name: { contains: input.productName, mode: 'insensitive' } }
      });

      if (!product) return `I couldn't find a product named "${input.productName}".`;

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
          data: { quantity: existing.quantity + (input.quantity || 1) }
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId: cart.id, productId: product.id, quantity: input.quantity || 1 }
        });
      }

      return `Successfully added ${input.quantity || 1} x ${product.name} to your cart!`;
    }

    if (name === "checkDelivery") {
      if (input.location === 'last_sent_location') {
        return "I see your location pin! Delivery to that area is $5.00 flat rate.";
      }
      return "Please send your location pin so I can check delivery availability and cost for you.";
    }

    if (name === "searchDocuments") {
      const docs = await prisma.document.findMany({
        where: { 
          OR: [
            { content: { contains: input.query, mode: 'insensitive' } },
            { title: { contains: input.query, mode: 'insensitive' } }
          ]
        },
        take: 3
      });
      if (docs.length === 0) return "I couldn't find any documents with that information.";
      return docs.map(d => `[Source: ${d.title || 'General'}]\n${d.content}`).join('\n\n');
    }

    return "Tool not implemented.";
  }
}

export class MockAgentService {
  static async process(text: string, context: SessionContext): Promise<string> {
    const input = text.toLowerCase();

    if (input.includes('browse') || input.includes('catalog') || input.includes('menu')) {
      return `Here is our catalog:\n• Premium Coffee Beans - $15.00\n• Green Tea Leaves - $10.00\n• Vanilla Syrup - $8.00\n\nWhat would you like to add to your cart?`;
    }

    if (input.includes('add') && input.includes('cart')) {
      return `I've added that to your cart! (Mock Cart)`;
    }

    if (input.includes('delivery') || input.includes('check')) {
      return `We deliver to your location! Please send your location pin to confirm shipping cost.`;
    }

    if (input.includes('policy') || input.includes('shipping') || input.includes('refund')) {
      return `Our Shipping Policy: We ship to all areas in Lagos and Abuja. Flat rate is $5.00.\nOur Refund Policy: Refunds are available within 7 days if the bag is unopened.`;
    }

    return `I'm VendorMind AI (Mock). I can help you browse our catalog, add items to your cart, check delivery, or answer questions about our policies. Try saying "browse catalog" or "what is your shipping policy"!`;
  }
}
