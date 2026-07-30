# Local Development Guide

Complete setup guide for running VendorMind locally on your laptop using Bun, Fastify, and PostgreSQL with pgvector.

---

## 📋 Prerequisites

- **Bun**: `>= 1.1.0` (`curl -fsSL https://bun.sh/install | bash`)
- **Node.js**: `>= 20`
- **PostgreSQL**: `>= 15` with `pgvector` extension installed
- **Groq / Anthropic / OpenAI API Keys**

---

##  Quickstart

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Zenmisan/vendormind.git
cd vendormind

# Install backend dependencies
bun install

# Install dashboard dependencies
cd dashboard && bun install && cd ..
```

---

### 2. Environment Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Configure your local credentials in `.env`:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vendormind?schema=public"
GROQ_API_KEY="gsk_..."
OPENAI_API_KEY="sk-..."
BMONI_API_KEY="pk_a025cacbf33a_76fb864113f3540909de5b1da39cc146906e35b1c6d4d1e4"
BMONI_BASE_URL="https://embedded-dev.bmoni.com"
```

---

### 3. Database Migration & Vector Extension

```bash
# Push Prisma schema to PostgreSQL
bunx prisma db push

# Generate Prisma client
bunx prisma generate
```

---

### 4. Run Development Servers

Start the backend API gateway & WhatsApp socket manager:

```bash
bun run dev
```

In a separate terminal, start the React Vite dashboard:

```bash
cd dashboard
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
