# Track: Customer Name from WhatsApp

**Status:** Completed  
**Date:** 2026-07-07

## Changes
- [x] `InboundMessageJob.customerName?: string` added to queue.ts
- [x] Fleet worker: `msg.pushName?.trim()` passed as `customerName` in all job types
- [x] inboundProcessor: new customer created with pushName; existing "WhatsApp Customer" updated when real name arrives
- [x] Workers restarted

## Behaviour
- Saved contact messages: `msg.pushName` = contact's display name → shown in Conversations
- Unsaved contacts: `msg.pushName` = their own WhatsApp name (what they set for themselves) → shown
- If pushName is empty/undefined: falls back to "WhatsApp Customer"
- Already-created customers with "WhatsApp Customer" name auto-updated on next message
