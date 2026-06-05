# VendorMind - Project Memory

This file serves as the local index for project context and decisions, ensuring continuity across Gemini sessions.

## Current State
- **Phase:** Phase 4 (Intelligence & RAG) Completed.
- **Final Blueprint:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Project Rules:** [GEMINI.md](./GEMINI.md)

## Key Accomplishments (Completed)
- **Phase 1: Foundation**: Bun, Postgres (pgvector), Redis, Prisma, PM2 orchestration.
- **Phase 2: Core Loop**: BullMQ decoupled queues, persistent session context.
- **Phase 3: Economic Defense**: Wallet balance, circuit breaker, billing deduction.
- **Phase 4: Intelligence**: Recursive LLM loop, RAG (document search), edge voice note stub.

## Key Decisions
- Adopted the **Vertical Slice** implementation model.
- Decoupled **WhatsApp Fleet** from the **Core API**.
- Implemented **Durable State** in Postgres for carts/sessions/orders.
- Implemented **Two-Tier Memory** (Recent + Rolling Summary).
- Enforced **Economic Defense** at the processor level.
- Added **Location Pin** parsing into {lat, lng} system notes.

## Next Steps
- **Phase 5: Autonomous Scale**: Implement multi-tenant onboarding UI and catalog upload.
- **Deepgram Integration**: Replace voice note stub with real transcription.
- **Real Vector Search**: Swap keyword search in `searchDocuments` for `pgvector` similarity search once embedding API is live.

## Session Continuity
To resume this project's development, run `gemini` in this directory. The `GEMINI.md` file will automatically provide the necessary context.
