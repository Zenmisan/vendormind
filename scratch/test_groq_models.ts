import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testModel(modelName: string) {
  try {
    console.log(`Testing Groq model: ${modelName}...`);
    const res = await groq.chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
      max_tokens: 50
    });
    console.log(`✅ Success with ${modelName}: "${res.choices[0].message.content}"`);
  } catch (err: any) {
    console.error(`❌ Failed with ${modelName}:`, err.message);
  }
}

async function main() {
  await testModel('meta-llama/llama-4-scout-17b-16e-instruct');
  await testModel('llama-3.3-70b-versatile');
  await testModel('llama-3.1-8b-instant');
}

main();
