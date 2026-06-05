# VendorMind Project Instructions

This file contains the foundational mandates and architectural decisions for the VendorMind project. It is intended to be loaded automatically by Gemini CLI in this workspace.

## Core Architectural Mandates
1. **Vertical Slices:** Development must follow the vertical-slice phasing defined in `ARCHITECTURE.md`. Each phase must result in a testable, runnable demo.
2. **Microservice Separation:** The WhatsApp Fleet (Baileys) must run as an isolated worker pool managed by PM2, separate from the Fastify API.
3. **Durable State:** All critical state (carts, sessions, orders) must be stored in Postgres. Redis is for performance caching and locking only.
4. **Tenant Isolation:** Every agent prompt must be wrapped in the strict isolation boundary defined in the blueprint to prevent cross-tenant data bleed.
5. **Economic Defense:** Every LLM call must be preceded by a vendor wallet balance check and a customer-level circuit breaker.

## Specialized Skills
The following skills should be activated for expert guidance during their respective phases:
- **Phase 1-2:** `nodejs-backend-patterns`, `postgresql-table-design`, `error-handling-patterns`
- **Phase 3:** `billing-automation`, `python-background-jobs` (for worker patterns)
- **Phase 4-5:** `rag-implementation`, `embedding-strategies`, `prompt-engineering-patterns`

## Implementation Details
- **Location Parsing:** Always parse WhatsApp location pins into coordinates for delivery tools.
- **Voice Notes:** Transcribe at the edge (Fleet worker) before queueing to the Gateway.
- **Roll Sum:** Use rolling summarization for conversation context management.
