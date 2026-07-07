# Track: Three Bug Fixes

**Status:** Completed  
**Date:** 2026-07-07

## Bugs Fixed

### 1. Bot responding to groups/broadcasts
`messages.upsert` handler: added check `!remoteJid.endsWith('@s.whatsapp.net')` → skip.
Groups end in `@g.us`, broadcasts in `@broadcast`, newsletters in `@newsletter`. Only `@s.whatsapp.net` = personal DM.

### 2. Outbound messages not reaching users
- Added `throw err` so BullMQ retries on `sendMessage` failure (was silently swallowed)
- Added auth state check before sending — throws if socket not authenticated
- Logs actual error message on failure
- Added `✅ Message delivered` confirmation log

### 3. Mobile sign-out not visible
- Added sign-out (+ wallet, theme toggle) inside `.sidebar-nav` with class `sidebar-mobile-only`
- CSS: `.sidebar-mobile-only { display: none }` on desktop, `display: flex` at ≤980px
- Desktop sidebar-footer unchanged
