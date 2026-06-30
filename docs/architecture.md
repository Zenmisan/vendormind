# Architecture

## System Stack

```
WhatsApp Customers
       │
       ▼
Baileys Fleet Workers (PM2, one per vendor number)
  ├── Groq Whisper  ← voice notes transcribed at edge
  ├── Location parser ← {lat,lng} injected as system note
  └── BullMQ inbound-messages queue
       │
       ▼
Inbound Processor Worker
  ├── Circuit breaker (throttle per customer)
  ├── Wallet check → overdraft buffer → graceful pause
  ├── Handoff flag check (skip bot if human took over)
  └── Agent Service
        ├── searchCatalog
        ├── addToCart
        ├── checkDelivery
        ├── searchDocuments  (pgvector similarity → LIKE fallback)
        ├── generatePaymentLink  (Nomba)
        └── handoff
       │
       ▼
BullMQ outbound-messages queue
       │
       ▼
Baileys Fleet Worker → WhatsApp reply
```

## Persistence

| Store | Purpose |
|---|---|
| Postgres | Source of truth — vendors, products, customers, orders, carts, sessions, documents |
| pgvector | Product/document embeddings for semantic search |
| Redis | Session history cache, cart cache, handoff flags, circuit breaker counters, BullMQ |

## Background Workers

| Worker | Queue | Trigger |
|---|---|---|
| `inboundProcessor` | `inbound-messages` | Every WhatsApp message |
| `releaseReservation` | `release-reservation` | 30 min after `generatePaymentLink` |
| `embedProduct` | `embed-product` | After catalog upload |

## AI Fallback Chain

```
Claude Sonnet (primary)
  └── 429 / 500 / timeout → Claude Haiku
        └── fail → Groq llama-3.1-70b
              └── all fail → queue retry + "just a moment" reply
```

Summarization of old context uses Claude Haiku (cheap, inline).

## Economic Guardrails

```
balance > $2.00     → normal operation
$0.00–$2.00         → warning email sent to vendor
$0.00 to -$2.50     → overdraft buffer (finishes active conversation)
< -$2.50            → hard block, graceful pause message, handoff flag set
```

## Payment Flow

```
Customer: "checkout"
  → Agent calls generatePaymentLink
  → Order created (status: PENDING)
  → Stock incremented to reservedStock
  → SoftReservation created (expires: now + 30 min)
  → Nomba checkout order initialized
  → release-reservation job enqueued (delay: 30 min)
  → Cart cleared
  → Payment URL sent to customer

Customer pays → Nomba webhook POST /webhooks/nomba
  → Webhook signature verified
  → Order status → PAID
  → Stock decremented (sold)
  → SoftReservation marked released
  → Receipt sent via outbound queue

30-min timer fires (if not paid):
  → reservedStock decremented (released)
  → Order status → CANCELED
  → Customer notified
```

## Multi-tenancy

Each vendor gets:
- One PM2 fleet worker process (`VENDOR_ID` env var)
- Isolated product/customer/order data via `vendorId` FK on every table
- Separate wallet balance
- Separate WhatsApp session (Baileys auth state in DB)

One inbound processor handles all vendors — jobs are vendor-tagged.
