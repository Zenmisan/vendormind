const apiKey = process.env.AGENT_ROUTER_API_KEY || 'sk-elSrFN5fD7HXk5ggOoxieT3ZOIsnvrl8gVrNxaN3KU0UwlG9';
const model = process.env.AGENT_ROUTER_MODEL || '4.8';
const baseUrl = process.env.AGENT_ROUTER_BASE_URL || 'https://agentrouter.org/v1';

async function testAgentRouter() {
  console.log(`Testing Agent Router endpoint: ${baseUrl}/chat/completions with model ${model}...`);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are Zinc, the VendorMind AI sales agent.' },
          { role: 'user', content: 'Hello, what can you do?' }
        ]
      })
    });

    const status = res.status;
    const text = await res.text();
    console.log(`Status: ${status}`);
    console.log(`Response: ${text.slice(0, 500)}`);
  } catch (err: any) {
    console.error('Error calling Agent Router:', err.message);
  }
}

testAgentRouter();
