# VendorMind - AI WhatsApp Sales Agent for African Merchants

[![Live Web App](https://img.shields.io/badge/Web_App-vendormind--z.web.app-indigo?style=for-the-badge&logo=firebase)](https://vendormind-z.web.app)
[![Runtime](https://img.shields.io/badge/Runtime-Bun-black?style=for-the-badge&logo=bun)](https://bun.sh)
[![Agent Persona](https://img.shields.io/badge/AI_Agent-Zinc-indigo?style=for-the-badge&logo=openai)](https://vendormind-z.web.app)
[![Payment Gateway](https://img.shields.io/badge/Payments-BMONI_cNGN_Smart_Wallet-emerald?style=for-the-badge)](https://bmoni.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **Turn WhatsApp chats into paid orders. Automatically.**
> VendorMind gives your business a 24/7 AI sales agent (**Zinc**) that lives inside WhatsApp. It answers customer questions, recommends products, manages carts, and collects payments via BMONI Smart Wallets - while you focus on running your business.

---

## Key Features & Capabilities

- **Zinc AI Sales Agent**: Natural product recommendations, context-aware memory, store policy answers, and Pidgin/English multi-lingual support powered by Groq Llama 3.3 70B & Claude 3.5 Sonnet.
- **BMONI cNGN Smart Wallet**: Native in-chat cNGN payments, instant NGN virtual bank accounts for customers, and direct bank offramps without external redirect loops.
- **Voice Commerce**: Automatic transcription of customer audio voice notes powered by Groq Whisper Turbo.
- **Smart Cart & 30-Min Soft Lock**: In-chat shopping cart state, automated total calculations, and 30-minute inventory reservations during checkout.
- **Product Image Grid & Uploads**: Rich catalog view with product image URLs, upload previews, and fallback avatar generators.
- **pgvector Semantic Search**: High-accuracy cosine similarity product search (OpenAI 1536-dim embeddings) for natural customer descriptions.
- **AI Business Advisor**: Morning plain-English business briefings, 24-hour revenue snapshots, and interactive data Q&A.
- **Smart Customer Classifier**: Differentiates commercial inquiries from casual friend chit-chat to stand down automatically and conserve API usage.
- **Human Handoff & Reconnect Guards**: One-tap human takeover, dashboard notifications, and WhatsApp socket reconnect timestamp guards against message floods.
- **Complete Marketing & Legal Suite**: Full word-for-word pages for /about, /privacy, /terms, /help (searchable FAQ), /contact (interactive desk), /how-it-works, /features, /pricing, and /blog.

---

## Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Runtime & Package Manager** | Bun (`>= 1.1.0`) |
| **WhatsApp Engine** | Baileys (`@whiskeysockets/baileys`) multi-device sockets |
| **API Gateway** | Fastify |
| **Database & Vector Storage** | PostgreSQL 15 + `pgvector` extension |
| **ORM & Migrations** | Prisma ORM |
| **LLM Inference** | Groq (`llama-3.3-70b-versatile`) + Anthropic Claude (`claude-3-5-sonnet`) |
| **Voice Processing** | Groq Whisper Turbo |
| **Payments & Wallets** | BMONI Smart Wallet (cNGN + NGN Virtual Accounts) |
| **Frontend App** | React + Vite + Tailwind CSS + Lucide Icons + PWA (Firebase Hosting) |
| **Smooth Animations** | Lenis + Framer Motion |

---

## Quick Start

### 1. Prerequisites
- [Bun](https://bun.sh) (v1.1+)
- PostgreSQL 15+ with `pgvector` extension
- Groq / Anthropic / OpenAI API Keys

### 2. Repository Setup
```bash
# Clone the repository
git clone https://github.com/zenmisan/vendormind.git
cd vendormind

# Install backend & frontend dependencies
bun install
cd dashboard && bun install && cd ..
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure credentials in `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vendormind?schema=public"
GROQ_API_KEY="gsk_..."
OPENAI_API_KEY="sk-..."
BMONI_API_KEY="pk_a025cacbf33a_76fb864113f3540909de5b1da39cc146906e35b1c6d4d1e4"
BMONI_BASE_URL="https://embedded-dev.bmoni.com"
```

### 4. Database Setup & Vector Migration
```bash
bunx prisma db push
bunx prisma generate
```

### 5. Launch Backend & Frontend
```bash
# Terminal 1: Start Fastify Gateway & WhatsApp Fleet
bun run dev

# Terminal 2: Start Vite React Dashboard
cd dashboard
bun run dev
```

Visit the dashboard at http://localhost:5173.

---

## Build & Verification

```bash
# Verify TypeScript compilation (0 errors)
bunx tsc --noEmit

# Compile Vite production build
cd dashboard && bun run build
```

---

## Documentation Index

For full architectural details, sequence diagrams, and deployment guides, check the [docs/](docs/README.md) directory:

- **[docs/README.md](docs/README.md)** - Master documentation sitemap and coding standards.
- **[docs/architecture/bmoni-wallet-ledger.md](docs/architecture/bmoni-wallet-ledger.md)** - BMONI cNGN smart wallet ledger and payouts.
- **[docs/architecture/ai-sales-agent.md](docs/architecture/ai-sales-agent.md)** - Zinc AI persona and pgvector search pipeline.
- **[docs/architecture/whatsapp-gateway.md](docs/architecture/whatsapp-gateway.md)** - Baileys multi-tenant socket fleet and reconnect guards.
- **[docs/architecture/catalog-embedding.md](docs/architecture/catalog-embedding.md)** - Catalog ingestion, fuzzy CSV matcher and embedding worker.
- **[docs/architecture/sales-checkout-flow.md](docs/architecture/sales-checkout-flow.md)** - End-to-end sales sequence and in-chat payment links.
- **[docs/diagrams/README.md](docs/diagrams/README.md)** - Mermaid C4 diagrams, sequence flows and state machines.
- **[docs/guides/local-development.md](docs/guides/local-development.md)** - Local development quickstart guide.
- **[docs/guides/database-setup.md](docs/guides/database-setup.md)** - PostgreSQL + pgvector setup and Prisma schema migrations.
- **[docs/guides/deploy-backend.md](docs/guides/deploy-backend.md)** - Fastify gateway deployment on Render / Docker.
- **[docs/guides/deploy-frontend.md](docs/guides/deploy-frontend.md)** - Vite dashboard deployment on Firebase Hosting.

---

## License & Contact

Distributed under the MIT License. Built for African merchants by **VendorMind Technologies**.

- **Live Web App**: https://vendormind-z.web.app
- **Support Email**: zenmisan@gmail.com
