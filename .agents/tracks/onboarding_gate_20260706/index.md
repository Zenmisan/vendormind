# Track: Onboarding Gate

**Status:** Completed  
**Date:** 2026-07-06

## Summary

Implement backend endpoints and frontend gate indicators to block WhatsApp agent processing and onboarding completion until >80% of catalog products are embedded.

## Tasks

### Phase 1: Backend Foundation
- [x] **Task 1.1**: Add `GET /vendors/:id/catalog/progress` to `src/gateway/server.ts` using pgvector raw SQL count.
- [x] **Task 1.2**: Update `GET /vendors/:id/products` in `src/gateway/server.ts` to query and return real `isEmbedded` status.
- [x] **Task 1.3**: Add catalog embedding guardrail check to `inboundProcessor.ts` to auto-reply with a setup message if progress < 80%.

### Phase 2: UI Integration
- [x] **Task 2.1**: Update `Products.tsx` to display real `isEmbedded` indicator.
- [x] **Task 2.2**: Update `Onboard.tsx` to poll catalog progress at the final step and block completion until >= 80% is ready.

### Phase 3: Verification
- [x] **Task 3.1**: Verify smoke test passes.
- [x] **Task 3.2**: Add catalog progress verification tests.
