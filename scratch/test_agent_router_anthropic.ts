import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL || "https://agentrouter.org",
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN || "sk-elSrFN5fD7HXk5ggOoxieT3ZOIsnvrl8gVrNxaN3KU0UwlG9"
});

async function testAgentRouterAnthropic() {
  const model = process.env.CLAUDE_CODE_SUBAGENT_MODEL || "claude-opus-4-8";
  console.log(`Testing Agent Router Anthropic SDK format at https://agentrouter.org with model ${model}...`);
  try {
    const res = await client.messages.create({
      model: model,
      max_tokens: 1024,
      system: "You are Zinc, the AI sales assistant for VendorMind.",
      messages: [{ role: "user", content: "Hello! How do you work?" }]
    });

    console.log("Success! Response from Agent Router:");
    console.log(res);
  } catch (err: any) {
    console.error("Error from Agent Router Anthropic SDK call:", err.message);
  }
}

testAgentRouterAnthropic();
