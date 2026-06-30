# Development Guide

## Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) (for Postgres + Redis)
- WhatsApp account for testing (any number)

## Setup

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
bun install
cd dashboard && bun install && cd ..

# 3. Run migrations
bunx prisma migrate dev --name init

# 4. (Optional) seed demo data
bun run prisma/seed.ts

# 5. Fill in API keys
nano .env   # see docs/environment.md for what each key does
```

## Running locally

### All at once (PM2)
```bash
bunx pm2 start ecosystem.config.cjs
bunx pm2 logs          # tail all logs
bunx pm2 logs vm-inbound-processor  # single process
bunx pm2 stop all
```

### Separate terminals (easier for debugging)
```bash
# Terminal 1 — REST API
bun run src/gateway/server.ts

# Terminal 2 — WhatsApp connection
bun run src/fleet/worker.ts

# Terminal 3 — message processor
bun run src/workers/main.ts

# Terminal 4 — reservation expiry jobs
bun run src/workers/releaseMain.ts

# Terminal 5 — embedding jobs (needs OPENAI_API_KEY)
bun run src/workers/embedMain.ts
```

## Testing without WhatsApp

Use the interactive REPL to simulate a customer conversation:

```bash
# Requires: gateway + inbound processor running
bun run scripts/test-loop.ts

# Commands:
# > browse catalog
# > add coffee to cart
# > loc:6.5244,3.3792      ← sends a location pin
# > checkout
# > exit
```

Run the automated smoke test (checks browse → cart → location → policy):
```bash
bun run scripts/verify.ts
```

Check a vendor's wallet balance:
```bash
VENDOR_ID=1 bun run scripts/check-balance.ts
```

## Useful commands

```bash
# DB GUI
bunx prisma studio

# Re-generate Prisma client after schema changes
bunx prisma generate

# Create a new migration after schema changes
bunx prisma migrate dev --name <description>

# Top up a vendor wallet (via API)
curl -X POST http://localhost:3000/topup \
  -H "Content-Type: application/json" \
  -d '{"vendorId":"1","amount":10}'

# Ops dashboard
curl http://localhost:3000/ops/dashboard | jq
```

## WhatsApp pairing

When `src/fleet/worker.ts` starts for the first time, it prints a QR code in the terminal. Scan it with WhatsApp. Auth state is persisted to Postgres — subsequent restarts reconnect without re-scanning.

To re-pair: delete the `whatsapp_sessions` rows for the vendor and restart the worker.

## Adding a second vendor (multi-tenant)

1. Register the vendor: `POST /vendors/register`
2. Note the returned `vendorId`
3. Add a new fleet worker entry to `ecosystem.config.cjs`:
   ```js
   { name: 'vm-fleet-vendor-2', script: 'src/fleet/worker.ts', interpreter: 'bun', env: { VENDOR_ID: '2' } }
   ```
4. `bunx pm2 restart ecosystem.config.cjs`
5. Scan QR for the new vendor's number

## Project structure

```markdown
src/
  fleet/
    worker.ts          WhatsApp connection + message intake
    auth.ts            Baileys auth state persisted to Postgres
  gateway/
    server.ts          Fastify REST API
  shared/
    agent.service.ts   LLM agent + all tools
    ai.service.ts      Claude/Gemini/Groq fallback chain
    billing.service.ts Wallet check + deduction
    context.service.ts Two-tier memory (recent + rolling summary)
    nomba.service.ts    Nomba API wrapper
    prisma/client.ts   Prisma singleton
    queue.ts           BullMQ queue definitions
    redis.ts           Redis singleton
    utils/
      circuitBreaker.ts Customer throttle (10 msgs/min)
  workers/
    main.ts            Inbound processor entry point
    inboundProcessor.ts Message routing + billing + agent call
    releaseMain.ts     Reservation expiry entry point
    releaseReservation.ts 30-min stock release worker
    embedMain.ts       Embedding worker entry point
    embedProduct.ts    OpenAI embeddings → pgvector
prisma/
  schema.prisma        DB schema
  seed.ts              Demo data
scripts/
  test-loop.ts         Interactive bot REPL (no WhatsApp needed)
  verify.ts            Automated E2E smoke test
  check-balance.ts     Print vendor wallet balance
docs/
  architecture.md      System design + flows
  api.md               REST endpoint reference
  environment.md       Env var reference
  development.md       This file
dashboard/             Vendor onboarding UI (Vite + React + Tailwind) — WIP
```
