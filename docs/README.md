# VendorMind Documentation

Everything about how VendorMind is built, how the AI agent operates, and how to run/deploy it.

---

## Architecture & Core Mechanics

Read these when you want to understand how VendorMind works under the hood or when making architectural changes.

- [BMONI Smart Wallet & Ledger](architecture/bmoni-wallet-ledger.md) - Native cNGN smart wallet integration, on-chain transfer rails, prepaid credit ledger, and vendor payouts.
- [AI Sales Agent & Vector Search](architecture/ai-sales-agent.md) - Groq Llama 3.3 70B & Claude 3.5 Sonnet persona engine, pgvector catalog search, voice note transcription, and prompt safety.
- [WhatsApp Gateway & Fleet Manager](architecture/whatsapp-gateway.md) - Baileys WhatsApp socket management, multi-vendor QR pairing, stale message reconnect guards, and human handoff routing.
- [Catalog Embedding & Ingest](architecture/catalog-embedding.md) - CSV/Excel fuzzy column parser, asynchronous pgvector embedding pipeline, and search fallbacks.
- [Sales & In-Chat Checkout Flow](architecture/sales-checkout-flow.md) - End-to-end conversation sequence from greeting, cart persistence, instant in-chat payment link to receipt delivery.

---

## Diagrams

- [System Architecture & Flowcharts](diagrams/README.md) - C4 model diagrams, system flowcharts, payment sequence diagrams, state machines (WhatsApp socket, Order lifecycle, Cart state).

---

## Guides

### Setup
- [Local Development](guides/local-development.md) - Full laptop setup instructions (Bun, Fastify, PostgreSQL + pgvector, Baileys).
- [Database Setup](guides/database-setup.md) - PostgreSQL + pgvector extension configuration, Prisma schema migrations, and seed scripts.

### Deployment
- [Deploy Backend](guides/deploy-backend.md) - Deploying the Fastify API Gateway & Fleet Service on Render or Docker.
- [Deploy Frontend](guides/deploy-frontend.md) - Deploying the Vite React Dashboard & Landing Page to Firebase Hosting.

---

## Conventions & Best Practices

- **Monetary Values**: All product prices and wallet amounts are stored as integer units in kobo/Naira numbers (e.g., N5,000 stored as 5000 or kobo integer). Never floating-point approximations.
- **AI Tool Schemas**: Groq & Claude tool calls require strict type validation. Optional tools arrays are omitted when empty to prevent HTTP 400 API errors.
- **Sample Catalog IDs**: Local mock products use `sample-*` IDs and update React state directly without issuing backend API mutation calls.
- **Commit Messages**: Conventional commits (`feat(whatsapp): ...`, `fix(bmoni): ...`, `docs: ...`), imperative tense.
