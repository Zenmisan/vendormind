# VendorMind Architecture (Final Blueprint) - The Vertical Slice Model

## 1. System Overview
VendorMind is a multi-tenant, white-label AI sales agent platform. This final architecture organizes the build into testable vertical slices and includes comprehensive guardrails against infrastructure failure, economic exploitation, prompt bleeding, and operational blindspots.

## 2. The Complete System Stack

```text
WhatsApp Fleet (PM2)
  └── Baileys workers → Groq Whisper (audio) & Location Parser → BullMQ per-session queues

Fastify Gateway
  └── Circuit breakers → Wallet check → Session lock → Agent

Unified Agent (Claude Sonnet → Haiku fallback)
  └── Tools: searchCatalog | addToCart | generatePaymentLink | checkDelivery | handoff

Postgres (Source of Truth)
  └── vendors | products + pgvector | orders | carts | customers | wa_sessions

Redis (Performance Layer)
  └── Session history | cart cache | worker heartbeats | session locks | handoff flags

BullMQ
  └── embed-product | process-webhook | release-reservation | send-receipt | send-alert
```

## 3. Refined System Guardrails

### A. Edge Intake: Transcription & Location Parsing
*   **Audio Transcription:** Voice Notes are transcribed by Groq Whisper inside the WhatsApp Fleet worker before queuing.
*   **Location Pins:** WhatsApp location pins are parsed into `{lat, lng}` coordinates at the edge and passed to the Gateway as a system note: `[User sent precise location: Lat X, Lng Y]`, enabling the `checkDelivery` tool to function accurately.
*   **Media Degradation:** Images/videos trigger a graceful "text-only assistant" fallback.

### B. Graceful Economic Degradation (Wallet UX)
*   **Warning Threshold (20%):** Triggers an email to the vendor.
*   **Overdraft Buffer:** Allows a small negative balance (e.g., 50 messages) to finish active conversations.
*   **Graceful Pause:** Once overdraft is consumed, the bot replies: *"I need to pause for a moment, let me get the vendor for you!"*, sets the handoff flag, and sends the vendor a top-up link.

### C. Context Capping (Rolling Summarization)
To prevent exponential token costs from long conversations, the system uses a **Rolling Summary**. The context window passed to the LLM is strictly capped to: `[Dense Summary of older messages] + [Last 5 raw messages]`. A cheaper model (Haiku) updates the summary asynchronously.

### D. Consistent Prompt Isolation (AI Fallback)
To guarantee tenant isolation across fallbacks, the chain stays within Anthropic:
*   **Primary:** Claude 3.5 Sonnet
*   **Fallback 1 (429/500):** Claude 3.5 Haiku
*   **Fallback 2:** 60-second queue retry with a "Just a moment..." reply.

### E. Operational Observability
An internal Fastify route (`/ops/dashboard`) provides real-time views: PM2 worker heartbeats, BullMQ queue depths, active conversation count, and recent API error rates.

## 4. Implementation Phasing (Vertical Slices)

**Phase 1: Foundation (The Resilient Echo)**
*   *Build:* Postgres + Redis + Prisma schema. WhatsApp Fleet with PM2 supervision. Baileys echo bot with DB auth state and Logout Alerts.
*   *Demo:* Send a WhatsApp message, bot echoes it back. Restart server 5 times; bot reconnects without scanning a QR code.

**Phase 2: Core Loop (The Prototype)**
*   *Build:* Fastify gateway, Per-session inbound queues, Two-tier memory + Rolling Summarization. Location Pin parsing. Basic single-vendor Agent with hardcoded catalog.
*   *Demo:* Full conversation—customer can browse, add to cart, and check delivery via Location Pin.

**Phase 3: Commerce (The Money Maker)**
*   *Build:* Paystack integration. Soft reservations at checkout. Payment state machine. Abandoned cart recovery job (stock release).
*   *Demo:* Real money moves. Checkout reserves stock, generates receipt, and un-paid links expire/release stock after 30m.

**Phase 4: Resilience & Ops (The Defenses)**
*   *Build:* Circuit breakers. Vendor wallet (with overdraft buffer). Groq Whisper edge transcription. Sonnet -> Haiku fallback. Ops Dashboard.
*   *Demo:* Send a Voice Note, it gets processed. Spam the bot, it gracefully pauses. Run out of credits, it handles overdraft and alerts.

**Phase 5: Multi-tenant & RAG (The SaaS Platform)**
*   *Build:* `pgvector` + BullMQ embedding pipeline. Vendor onboarding portal. Onboarding Gate (embeddings > 80% ready).
*   *UX Warning:* Explicit onboarding disclaimer stating that using personal numbers will result in deletion of personal chats if migrated to Official Meta APIs later.
*   *Demo:* A second vendor signs up, uploads 100 products, waits for the progress bar, scans QR code, and goes live autonomously.
