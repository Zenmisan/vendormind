# Plan — Conversation Filters & Stand-down Classifier

## Execution Steps
1. **Define extractMessageText**: Implement recursive message formatting extractor inside [worker.ts](file:///home/zenmi/Projects/vendormind/src/fleet/worker.ts).
2. **Implement Classifier**: Create `isBusinessConversation` method inside [agent.service.ts](file:///home/zenmi/Projects/vendormind/src/shared/agent.service.ts) to classify messages using the LLM with fallback regex rules in `MockAgentService`.
3. **Stand-down Route**: Update the process pipeline in [agent.service.ts](file:///home/zenmi/Projects/vendormind/src/shared/agent.service.ts) to return `__STAND_DOWN__` for new personal messages, and handle this signal inside [inboundProcessor.ts](file:///home/zenmi/Projects/vendormind/src/workers/inboundProcessor.ts) to exit early.

## Verification
- Run `bun run scripts/verify.ts` and ensure 4/4 passing.
