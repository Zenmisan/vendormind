# Track: WhatsApp Reconnect Modal

**Status:** Completed  
**Date:** 2026-07-07

## Problem
When WA disconnects, vendor had no way to reconnect from Dashboard — only path was back through full onboarding wizard.

## Tasks

- [x] Create `WhatsAppConnectModal` component — QR + phone pairing, polls endpoints, auto-closes on connected
- [x] Add "Reconnect" button on Dashboard WA offline badge — opens modal
- [x] Modal wired to Dashboard state — `onConnected` sets `waConnected: true` and closes modal
