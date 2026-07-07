# Track: Dashboard Upgrades

**Status:** Completed  
**Date:** 2026-07-06

## Summary

Implement interactive manual chat takeover, vertical stepper onboarding wizard, and general UI polish based on Pinterest inspiration images.

## Tasks

### Phase 1: Interactive Chat Takeover
- [x] **Task 1.1**: Add `POST /vendors/:id/conversations/:customerId/messages` to `src/gateway/server.ts` to enqueue manual messages to BullMQ and save them in context.
- [x] **Task 1.2**: Update `Conversations.tsx` details layout to render a message input textbox and send button at the bottom of the feed when handed off.
- [x] **Task 1.3**: Wire up manual message submission to post to the server and update the local messages array.

### Phase 2: Onboarding Wizard visual upgrades
- [x] **Task 2.1**: Restyle `Onboard.tsx` step indicators to follow the vertical sidebar layout from `inspo/01.jpeg`.
- [x] **Task 2.2**: Integrate quick info callout blocks and status tags.

### Phase 3: Verification & Polish
- [x] **Task 3.1**: Verify smoke test passes.
- [x] **Task 3.2**: Add manual message verification E2E tests.
