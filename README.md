# VendorMind

Multi-tenant, white-label AI sales agent platform for WhatsApp. Vendors plug in their product catalog and get a bot that handles browse, cart, checkout, and payment with no code required.

## What it does

- Customers message the vendor's WhatsApp number in plain language
- AI agent (Claude Sonnet) handles browse, add-to-cart, delivery check, FAQ lookup, and checkout
- Nomba payment link generated at checkout; stock reserved for 30 minutes
- Voice notes transcribed at the edge via Groq Whisper
- Each vendor gets isolated data, a separate WhatsApp session, and a prepaid wallet

## Quick start

```bash
# 1. Start Postgres + Redis
docker compose up -d

# 2. Install dependencies
bun install

# 3. Configure environment — see docs/environment.md
nano .env

# 4. Run migrations
bunx prisma migrate dev --name init

# 5. Start everything
bunx pm2 start ecosystem.config.cjs
bunx pm2 logs
```

Scan the QR code printed by `vm-fleet-worker` with WhatsApp. The bot is live.

## Test without WhatsApp

```bash
# Interactive REPL — simulate a customer conversation
bun run scripts/test-loop.ts

# Automated smoke test
bun run scripts/verify.ts
```

## Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| WhatsApp | Baileys |
| API | Fastify |
| Queue | BullMQ |
| Database | Postgres + pgvector |
| Cache | Redis |
| ORM | Prisma |
| LLM | Claude Sonnet → Haiku → Groq (fallback chain) |
| Voice | Groq Whisper |
| Payments | Nomba |
| Process mgmt | PM2 |

## Docs

- [Architecture](docs/architecture.md) — system design, flows, guardrails
- [API Reference](docs/api.md) — REST endpoints
- [Environment Variables](docs/environment.md) — all config options
- [Development Guide](docs/development.md) — local setup, project structure, scripts

## Implementation status

See [STATUS](docs/STATUS.md) for what's done and what's left.
