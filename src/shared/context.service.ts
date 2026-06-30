import { prisma } from './prisma/client';
import Anthropic from "@anthropic-ai/sdk";

export interface SessionContext {
  summary: string;
  recentMessages: Anthropic.MessageParam[];
}

const MAX_RECENT_MESSAGES = 10;

export class ContextService {
  static async getContext(customerId: bigint): Promise<SessionContext> {
    const session = await prisma.wa_session.findUnique({
      where: { customerId }
    });

    if (!session || !session.context) {
      return { summary: '', recentMessages: [] };
    }

    const ctx = session.context as any;
    return {
      summary: ctx.summary || '',
      recentMessages: ctx.recentMessages || []
    };
  }

  static async updateContext(customerId: bigint, newMessage: Anthropic.MessageParam): Promise<void> {
    const currentContext = await this.getContext(customerId);
    
    const updatedMessages = [...currentContext.recentMessages, newMessage];
    
    let updatedSummary = currentContext.summary;
    let finalRecentMessages = updatedMessages;

    if (updatedMessages.length > MAX_RECENT_MESSAGES) {
      const oldestMessage = updatedMessages[0];
      const text = typeof oldestMessage.content === 'string' 
        ? oldestMessage.content 
        : JSON.stringify(oldestMessage.content);
      
      updatedSummary = await this.summarize(updatedSummary, oldestMessage.role, text);
      finalRecentMessages = updatedMessages.slice(1);
    }

    await prisma.wa_session.upsert({
      where: { customerId },
      update: {
        context: {
          summary: updatedSummary,
          recentMessages: finalRecentMessages
        } as any
      },
      create: {
        customerId,
        context: {
          summary: updatedSummary,
          recentMessages: finalRecentMessages
        } as any
      }
    });
  }

  private static async summarize(oldSummary: string, role: string, content: string): Promise<string> {
    const useLLM = process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('...');
    if (!useLLM) {
      return (oldSummary ? oldSummary + '\n' : '') + `${role}: ${content}`;
    }

    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 512,
        system: "You are a concise conversation summarizer. Update the current summary with the new message while keeping it under 2 paragraphs. Focus on important facts like user intent, products discussed, and delivery info.",
        messages: [
          { role: "user", content: `Current Summary:\n${oldSummary || 'No summary yet.'}\n\nNew Message to incorporate:\n${role}: ${content}` }
        ]
      });
      const block = response.content.find(b => b.type === 'text');
      return block && 'text' in block ? block.text : oldSummary;
    } catch (err) {
      console.error('Summarization failed:', err);
      return (oldSummary ? oldSummary + '\n' : '') + `${role}: ${content}`;
    }
  }
}
