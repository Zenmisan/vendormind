# Track: WhatsApp Disconnect Portal Fix

**Status:** Completed  
**Date:** 2026-07-06

## Problem
WhatsApp connected but portal showed wrong state in two scenarios:
1. Connected but onboard didn't reflect it immediately
2. Disconnected but dashboard still showed "online" badge — DB had stale `connected: true`

## Tasks

- [x] Fleet worker: upsert `{ connected: false }` on `connection === 'close'` before reconnect/clear — `src/fleet/worker.ts`
- [x] Dashboard: poll `GET /vendors/:id/whatsapp/qr` every 30s via `setInterval` to auto-update WA badge without manual refresh — `dashboard/src/pages/Dashboard.tsx`
