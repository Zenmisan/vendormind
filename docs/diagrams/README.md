# System Architecture & Diagrams

Comprehensive Mermaid diagrams covering VendorMind's architecture, data flows, and state machines.

---

## 🏗️ C4 System Overview

```mermaid
graph TD
    subgraph Client ["Client Layer"]
        VendorUI["Vendor Dashboard & Landing (React + Vite)"]
        CustomerWA["Customer WhatsApp App"]
    end

    subgraph Gateway ["API & Fleet Gateway"]
        FastifyServer["Fastify Gateway (Port 3000)"]
        BaileysFleet["Baileys Multi-Device Socket Fleet"]
    end

    subgraph Intelligence ["AI & Search Engine"]
        GroqLLM["Groq Llama 3.3 70B Engine"]
        ClaudeLLM["Anthropic Claude 3.5 Sonnet"]
        PgVector["pgvector Semantic Search"]
    end

    subgraph Settlement ["Payment & Ledger"]
        BmoniWallet["BMONI cNGN Smart Wallet API"]
        PostgresDB["PostgreSQL Database (Prisma)"]
    end

    VendorUI -->|HTTP / REST| FastifyServer
    CustomerWA <-->|WebSocket| BaileysFleet
    BaileysFleet <--> FastifyServer
    FastifyServer --> GroqLLM
    FastifyServer --> ClaudeLLM
    FastifyServer --> PgVector
    FastifyServer --> BmoniWallet
    FastifyServer --> PostgresDB
```

---

## 🔄 WhatsApp Socket Connection State Machine

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> PairingQR: Generate Auth QR / Pairing Code
    PairingQR --> Connected: Scan QR on WhatsApp
    Connected --> AIActive: Customer Messages Bot
    AIActive --> HumanHandoff: Customer types 'human' / 'agent'
    HumanHandoff --> AIActive: Vendor clicks 'Resume AI'
    Connected --> Reconnecting: Network Drop / Baileys Disconnect
    Reconnecting --> Connected: Socket Restored (Timestamp Guard Active)
    Reconnecting --> Disconnected: Auth Credentials Invalidated
```

---

##  BMONI Order Settlement Flow

```mermaid
sequenceDiagram
    autonumber
    Customer->>WhatsApp: Request Product Order
    WhatsApp->>ZincAgent: Query Catalog & Compute Total
    ZincAgent->>BMONI: Generate cNGN Smart Wallet Payment Link
    ZincAgent-->>Customer: Send Payment Link in Chat
    Customer->>BMONI: Complete Transfer
    BMONI-->>VendorWallet: Settle Funds directly in BMONI Wallet
    ZincAgent-->>Customer: Confirm Order Paid & Deliver Receipt
```
