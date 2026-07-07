import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export interface AIProviderResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    input: any;
  }>;
}

export class AIService {
  private static anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  private static gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "mock");
  private static groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "mock" });

  static async generateResponse(
    systemPrompt: string,
    messages: Anthropic.MessageParam[],
    tools: any[]
  ): Promise<AIProviderResponse> {
    const chain = [
      { name: 'Claude', fn: () => this.callClaude(systemPrompt, messages, tools) },
      { name: 'Gemini', fn: () => this.callGemini(systemPrompt, messages, tools) },
      { name: 'Groq', fn: () => this.callGroq(systemPrompt, messages, tools) }
    ];

    for (const provider of chain) {
      try {
        const hasKey = this.hasApiKey(provider.name);
        if (!hasKey) {
          console.warn(`⚠️ Skipping ${provider.name}: No API key configured.`);
          continue;
        }

        console.log(`🤖 Attempting ${provider.name}...`);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`${provider.name} timeout`)), 10000)
        );

        const result = await Promise.race([provider.fn(), timeoutPromise]) as AIProviderResponse;
        return result;
      } catch (err: any) {
        console.error(`❌ ${provider.name} failed:`, err.message);
        continue;
      }
    }

    console.warn("⚠️ All AI providers failed. Falling back to a local rule-based mock agent response.");
    const lastMsgText = this.mapContentToText(messages[messages.length - 1]?.content || "").toLowerCase();
    
    if (lastMsgText.includes("return") || lastMsgText.includes("policy") || lastMsgText.includes("refund")) {
      return {
        content: "Yes, we accept returns within 7 days in original condition. Please bring your receipt."
      };
    }
    
    if (lastMsgText.includes("location") || lastMsgText.includes("deliver")) {
      return {
        content: "Our kitchen is located in Lagos, Nigeria. We can deliver anywhere in Lagos for a flat fee."
      };
    }
    
    if (lastMsgText.includes("jollof") || lastMsgText.includes("menu") || lastMsgText.includes("catalog")) {
      return {
        content: "We have smoky Party Jollof Rice (₦2,500) and a Small Chops Combo (₦3,000) available."
      };
    }
    
    return {
      content: "Thank you for reaching out! Let me check that for you."
    };
  }

  private static hasApiKey(name: string): boolean {
    const key = name === 'Claude' ? process.env.ANTHROPIC_API_KEY 
             : name === 'Gemini' ? process.env.GEMINI_API_KEY 
             : process.env.GROQ_API_KEY;
    return !!key && !key.includes('...');
  }

  private static async callClaude(system: string, messages: Anthropic.MessageParam[], tools: any[]): Promise<AIProviderResponse> {
    const response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system,
      messages,
      tools
    });

    const toolCalls = response.content
      .filter(b => b.type === 'tool_use')
      .map(b => {
        const tb = b as any;
        return { id: tb.id, name: tb.name, input: tb.input };
      });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('\n');

    return { content: text, toolCalls: toolCalls.length > 0 ? toolCalls : undefined };
  }

  private static mapContentToText(content: any): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map(block => {
        if (block.type === 'text') return block.text;
        if (block.type === 'tool_use') return `[Called tool: ${block.name} with input: ${JSON.stringify(block.input)}]`;
        if (block.type === 'tool_result') return `[Tool result: ${block.content}]`;
        return JSON.stringify(block);
      }).join('\n');
    }
    return JSON.stringify(content);
  }

  private static getAlternateHistory(messages: Anthropic.MessageParam[]): Array<{ role: string; parts: Array<{ text: string }> }> {
    const history: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const m of messages) {
      const role = m.role === 'user' ? 'user' : 'model';
      const text = this.mapContentToText(m.content);
      
      const last = history[history.length - 1];
      if (last && last.role === role) {
        last.parts[0].text += '\n' + text;
      } else {
        history.push({ role, parts: [{ text }] });
      }
    }
    return history;
  }

  private static async callGemini(system: string, messages: Anthropic.MessageParam[], tools: any[]): Promise<AIProviderResponse> {
    const model = this.gemini.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: system,
      tools: [{ 
        functionDeclarations: tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.input_schema
        })) 
      }]
    } as any);

    const contents = this.getAlternateHistory(messages);
    const result = await model.generateContent({ contents });
    const response = result.response;
    
    const parts = response.candidates?.[0].content.parts || [];
    const textPart = parts.find(p => p.text);
    const toolParts = parts.filter(p => p.functionCall);
    
    return { 
      content: textPart?.text || "",
      toolCalls: toolParts.length > 0 ? toolParts.map(c => ({ id: 'gemini', name: c.functionCall!.name, input: c.functionCall!.args })) : undefined
    };
  }

  private static async callGroq(system: string, messages: Anthropic.MessageParam[], tools: any[]): Promise<AIProviderResponse> {
    const groqMessages = [
      { role: 'system' as const, content: system },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: this.mapContentToText(m.content)
      }))
    ];

    const groqTools = tools.map(t => ({
      type: 'function' as const,
      function: { name: t.name, description: t.description, parameters: t.input_schema }
    }));

    try {
      const response = await this.groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: groqMessages,
        tools: groqTools,
        tool_choice: 'auto',
        parallel_tool_calls: false,
        max_tokens: 2048,
      } as any);

      const msg = response.choices[0].message;
      const toolCalls = msg.tool_calls?.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments)
      }));

      return { content: msg.content || '', toolCalls: toolCalls?.length ? toolCalls : undefined };
    } catch (toolErr: any) {
      // Tool calling failed (common on some Groq models) — retry as plain text
      console.warn('⚠️ Groq tool calling failed, retrying as plain text...');
      const fallback = await this.groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: groqMessages,
        max_tokens: 1024,
      } as any);
      const text = fallback.choices[0].message.content || '';
      return { content: text };
    }
  }
}
