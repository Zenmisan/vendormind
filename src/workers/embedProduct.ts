import { Worker } from 'bullmq';
import { EMBED_QUEUE, EmbedProductJob } from '../shared/queue';
import { redisConnection } from '../shared/redis';
import { prisma } from '../shared/prisma/client';

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text, dimensions: 1536 })
  });

  if (!res.ok) throw new Error(`OpenAI embedding failed (${res.status}): ${await res.text()}`);
  const body = await res.json() as any;
  return body.data[0].embedding as number[];
}

const worker = new Worker<EmbedProductJob>(
  EMBED_QUEUE,
  async (job) => {
    const { productId, text } = job.data;
    const pId = BigInt(productId);

    console.log(`🧠 Embedding product ${productId}: "${text.slice(0, 60)}..."`);
    const vector = await getEmbedding(text);
    const vectorStr = `[${vector.join(',')}]`;

    await prisma.$executeRaw`
      UPDATE products
      SET embedding = ${vectorStr}::vector
      WHERE id = ${pId}
    `;

    console.log(`✅ Product ${productId} embedded`);
  },
  { connection: redisConnection }
);

console.log('👷 Embed Product Worker started');
export default worker;
