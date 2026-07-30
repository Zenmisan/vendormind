import { AgentService } from '../src/shared/agent.service';

async function testClassifier() {
  console.log('🧪 Testing AI Intent Classifier (Business vs Casual Chitchat)...\n');

  const testCases = [
    { text: "Hey bro how are you doing today", expected: "STAND_DOWN (Ignore)" },
    { text: "Yo what's up man", expected: "STAND_DOWN (Ignore)" },
    { text: "Good morning, do you have red velvet cake or chocolate cake in stock?", expected: "PROCESS (Order / Inquiry)" },
    { text: "I want to place an order for 2 items and get a payment link", expected: "PROCESS (Order / Checkout)" }
  ];

  for (const tc of testCases) {
    const isBusiness = await AgentService.isBusinessConversation(tc.text);
    const status = isBusiness ? '🟢 BUSINESS / ORDER QUERY' : '⏸️ CASUAL / PERSONAL (BOT STANDS DOWN)';
    console.log(`💬 Message: "${tc.text}"`);
    console.log(`   └─ Classification: ${status}`);
    console.log(`   └─ Expected: ${tc.expected}\n`);
  }

  process.exit(0);
}

testClassifier().catch(err => {
  console.error('❌ Classification test failed:', err);
  process.exit(1);
});
