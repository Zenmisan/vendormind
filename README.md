# 🛍️ VendorMind — AI WhatsApp Sales Agent for Merchants

[![Live Web App](https://img.shields.io/badge/Web_App-vendormind--z.web.app-indigo?style=for-the-badge&logo=firebase)](https://vendormind-z.web.app)
[![Runtime](https://img.shields.io/badge/Runtime-Bun-black?style=for-the-badge&logo=bun)](https://bun.sh)
[![Payment Gateway](https://img.shields.io/badge/Payments-Monnify-green?style=for-the-badge)](https://monnify.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **Turn WhatsApp chats into paid orders 24/7.**

VendorMind is a multi-tenant, white-label AI sales agent platform designed for Nigerian vendors and SME merchants. Vendors upload their product catalog (via Excel or CSV) and connect their WhatsApp number by scanning a QR code. The AI agent handles customer product inquiries, transcribes voice notes, performs pgvector semantic catalog searches, builds shopping carts, and sends instant **Monnify** payment checkout links directly inside WhatsApp.

---

## ✨ Key Features

- 🤖 **Claude AI Sales Agent**: Natural product recommendations, context-aware memory summaries, and store policy answers.
- 🎙️ **Voice Note Transcriptions**: Powered by Groq Whisper Turbo for edge audio processing.
- 💳 **Monnify Payment Integration**: Automated checkout link generation and real-time webhook order confirmation.
- 📦 **30-Minute Stock Reservation**: Soft inventory lock to prevent double-selling during checkout.
- 🔍 **pgvector Semantic Search**: Finds products even when customers describe items vaguely.
- 🛡️ **Smart Customer Classifier**: Differentiates business queries from casual chit-chat, standing down on personal messages.
- 📊 **Merchant Dashboard PWA**: Complete operational control — upload catalogs, manage orders, view chat transcripts, and track wallet balance.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime & Tooling** | Bun |
| **WhatsApp Engine** | Baileys (`@whiskeysockets/baileys`) |
| **API Gateway** | Fastify |
| **Task Queue** | BullMQ + Redis |
| **Database** | PostgreSQL + `pgvector` |
| **ORM** | Prisma |
| **LLM Provider** | Anthropic Claude (Sonnet / Haiku) + Groq (fallback) |
| **Voice Transcription** | Groq Whisper Turbo |
| **Payment Gateway** | Monnify |
| **Frontend Dashboard** | React + Vite + Tailwind CSS + PWA (Firebase Hosting) |
| **Process Management** | PM2 |

---

## ⚡ Quick Start

### 1. Prerequisites
- [Bun](https://bun.sh) (v1.0+)
- Docker & Docker Compose
- Node.js (v20+)

### 2. Infrastructure Setup
```bash
# Clone the repository
git clone https://github.com/zenmisan/vendormind.git
cd vendormind

# Start Postgres (pgvector) and Redis containers
docker compose up -d

# Install dependencies using Bun
bun install
```

### 3. Environment Configuration
Copy the `.env.example` file and set your credentials:
```bash
cp .env.example .env
```
Key environment variables:
- `ANTHROPIC_API_KEY`: Anthropic API key
- `MONNIFY_API_KEY`: Monnify Merchant API Key
- `MONNIFY_SECRET_KEY`: Monnify Secret Key
- `MONNIFY_CONTRACT_CODE`: Monnify Contract Code
- `GROQ_API_KEY`: Groq API key for Whisper voice notes

### 4. Database Migration & Seed
```bash
bunx prisma migrate dev --name init
bun run db:seed
```

### 5. Launch Application Services
```bash
# Start background workers, API gateway, and dashboard via PM2
bun run start
```

Scan the printed QR code with your WhatsApp Business app. Your AI sales agent is now live!

---

## 🧪 Testing & Verification

```bash
# Run full E2E verification test suite (5 verification steps)
bun run test

# Interactive REPL customer simulation
bun run repl
```

---

## 📚 Documentation

- [Architecture Guide](docs/architecture.md) — System design, queue architecture, and LLM fallbacks.
- [API Reference](docs/api.md) — Gateway REST endpoints.
- [Environment Guide](docs/environment.md) — Configuration key details.
- [Development Guide](docs/development.md) — Local development workflow and commands.

---

## 📄 License & Contact

Distributed under the MIT License. Built for Nigerian vendors by **VendorMind Technologies Limited**.

- **Web App**: [https://vendormind-z.web.app](https://vendormind-z.web.app)
- **Support Email**: [hello@vendormind.app](mailto:hello@vendormind.app)
