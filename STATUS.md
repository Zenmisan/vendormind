# VendorMind — Implementation Status

## Legend
- ✅ Complete
- 🚧 In Progress
- ❌ Not Started
- ⚠️ Needs env config

---

## Phase 1: Foundation ✅
- ✅ Postgres + Redis + Prisma schema (`prisma/schema.prisma`)
- ✅ WhatsApp Fleet (Baileys) with PM2 (`src/fleet/worker.ts`)
- ✅ DB auth state persistence (`src/fleet/auth.ts`)
- ✅ Auto-reconnect on disconnect

## Phase 2: Core Loop ✅
- ✅ Fastify gateway (`src/gateway/server.ts`)
- ✅ BullMQ per-session inbound queues (`src/shared/queue.ts`)
- ✅ Two-tier memory: recent messages + rolling summary (`src/shared/context.service.ts`)
- ✅ Rolling summarization via Claude Haiku
- ✅ Location pin parsing → system note (`src/fleet/worker.ts`)
- ✅ Agent tools: `searchCatalog`, `addToCart`, `checkDelivery`, `searchDocuments` (`src/shared/agent.service.ts`)

## Phase 3: Commerce ✅
- ✅ Paystack service: initialize + verify (`src/shared/paystack.service.ts`) ⚠️ Needs `PAYSTACK_SECRET_KEY` in `.env`
- ✅ `generatePaymentLink` agent tool — creates Order, reserves stock, returns Paystack URL
- ✅ `handoff` agent tool — sets Redis flag, transfers to human
- ✅ Soft stock reservations: `reservedStock` field on Product
- ✅ `SoftReservation` model — tracks expiry per order
- ✅ Payment webhook `POST /webhooks/paystack` — verifies HMAC, marks order PAID, sends receipt
- ✅ `release-reservation` BullMQ worker — runs after 30-min delay, releases stock + cancels unpaid order
- ✅ Receipt sent via outbound queue on payment confirmation

## Phase 4: Resilience & Ops ✅
- ✅ Circuit breaker: customer throttling (`src/shared/utils/circuitBreaker.ts`)
- ✅ Wallet balance check + deduction (`src/shared/billing.service.ts`)
- ✅ Overdraft buffer: processes until -$2.50, then hard block
- ✅ Wallet warning at $2.00: logs alert ⚠️ Add `SMTP_*` env vars for real email
- ✅ Graceful pause message + handoff flag set on overdraft (`src/workers/inboundProcessor.ts`)
- ✅ Groq Whisper real transcription wired (`src/fleet/worker.ts`) — key present in `.env`
- ✅ `/ops/dashboard` route: queue depths, active conversations, low-balance vendors
- ✅ Claude Sonnet → Haiku → Groq fallback chain (`src/shared/ai.service.ts`)

## Phase 5: Multi-tenant & RAG 🚧
- ✅ `embed-product` BullMQ worker (`src/workers/embedProduct.ts`) ⚠️ Needs `OPENAI_API_KEY` in `.env`
- ✅ `pgvector` similarity search in `searchDocuments` (falls back to LIKE when no embeddings yet)
- ❌ Vendor onboarding portal UI (`dashboard/`) — not started
- ❌ Onboarding Gate: block vendor go-live until >80% products embedded

## Bug Fixes Applied
- ✅ `context.service.ts`: wrong import path `'../shared/prisma/client'` → `'./prisma/client'`
- ✅ `worker.ts`: hardcoded `vendorId: '1'` → `process.env.VENDOR_ID || '1'`

---

## Requires Manual Action

| Action | Command / Note |
|---|---|
| Run schema migration | `bunx prisma migrate dev --name add-reservations` |
| Paystack key | `PAYSTACK_SECRET_KEY=sk_live_...` in `.env` |
| OpenAI key for embeddings | `OPENAI_API_KEY=sk-...` in `.env` |
| SMTP for wallet warning emails | Add `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` when ready |
| Per-vendor worker instances | Set `VENDOR_ID=<id>` per PM2 app entry in `ecosystem.config.cjs` |
