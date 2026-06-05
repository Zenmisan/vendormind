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

    throw new Error("All AI providers failed, timed out, or missing keys.");
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

  private static async callGemini(system: string, messages: Anthropic.MessageParam[], tools: any[]): Promise<AIProviderResponse> {
    const model = this.gemini.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      systemInstruction: system,
      tools: [{ 
        functionDeclarations: tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.input_schema
        })) 
      }]
    } as any);

    const history = messages.slice(0, -1).map(m => {
        const text = typeof m.content === 'string' ? m.content : (m.content as any).find((c:any) => c.text)?.text || "";
        return {
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text }]
        };
    });
    
    const lastMsg = messages[messages.length - 1].content as string;
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMsg);
    const response = result.response;
    
    const parts = response.candidates?.[0].content.parts || [];
    const textPart = parts.find(p => p.text);
    const toolParts = parts.filter(p => p.functionCall);
    
    return { 
      content: textPart?.text || "",
      toolCalls: toolParts.map(c => ({ id: 'gemini', name: c.functionCall!.name, input: c.functionCall!.args }))
    };
  }

  private static async callGroq(system: string, messages: Anthropic.MessageParam[], tools: any[]): Promise<AIProviderResponse> {
    const response = await this.groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: 'system', content: system },
        ...messages.map(m => {
            const text = typeof m.content === 'string' ? m.content : (m.content as any).find((c:any) => c.text)?.text || "";
            return { role: m.role, content: text };
        })
      ] as any,
      tools: tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema
        }
      }))
    });

    const msg = response.choices[0].message;
    const toolCalls = msg.tool_calls?.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments)
    }));

    return { content: msg.content || "", toolCalls };
  }
}
