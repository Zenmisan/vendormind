import { AIService } from '../src/shared/ai.service';

async function test() {
  const prompt = `You are Zinc, a friendly AI sales agent for VendorMind. Keep replies short, warm, and helpful.`;
  const result = await AIService.generateResponse(prompt, [{ role: 'user', content: 'What do you do?' }], []);
  console.log("AI Result:", result.content);
}

test().catch(console.error);
