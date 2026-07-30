# Sales & In-Chat Checkout Flow Architecture

This document details the end-to-end sales conversation lifecycle, cart management, instant in-chat payment links, and order confirmation.

---

## 🛒 Sales Conversation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant WA as WhatsApp Socket
    participant Agent as Zinc AI Agent
    participant Cart as Session Cart
    participant BMONI as BMONI Smart Wallet
    participant Vendor as Vendor Dashboard

    Customer->>WA: "Do you have Red Velvet Cake in Ikeja?"
    WA->>Agent: Process message + vector search
    Agent-->>Customer: "Yes! 8-inch Red Velvet is ₦12,500 + ₦2,000 Ikeja delivery. Total: ₦14,500. Should I reserve this?"
    Customer->>WA: "Yes please"
    Agent->>Cart: Add 8-inch Red Velvet + Delivery to Cart
    Agent->>BMONI: Reserve stock (30-min hold) & Generate Payment Link
    Agent-->>Customer: "Order reserved! Tap below to complete BMONI payment: [Payment Link]"
    Customer->>BMONI: Complete cNGN / Bank Transfer
    BMONI->>Vendor: Funds settled in Smart Wallet
    Agent-->>Customer: " Payment confirmed! Your order #VM-9402 is paid."
```

---

## ⏳ Stock Reservation & Expiry

- **Soft Hold**: Stock is temporarily held for **30 minutes** when a payment link is issued.
- **Auto Expiry**: If unpaid after 30 minutes, stock reservation is released back to available inventory.
- **Follow-up Reminder**: An automated reminder is sent after 15 minutes of inactivity.
