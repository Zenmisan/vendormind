# Spec: Onboarding Gate

## Goal
Implement a safety onboarding gate to block a vendor from going live and ensure the AI agent does not handle conversation flows until at least 80% of the vendor's catalog has been successfully embedded.

## Functional Requirements

### FR-1: Backend Progress API Endpoint
- Add `GET /vendors/:id/catalog/progress` to retrieve embedding stats.
- Response format:
  ```json
  {
    "total": 100,
    "embedded": 80,
    "progress": 80.0,
    "allowed": true
  }
  ```

### FR-2: Product Embedding Status in API
- Update the `GET /vendors/:id/products` endpoint to include the real `isEmbedded` boolean flag derived from whether the product has an embedding in pgvector.

### FR-3: Inbound Processor Safety Guardrail
- Update `inboundProcessor.ts` to block conversational processing if the vendor's catalog progress is < 80%.
- If blocked, return a friendly auto-reply: *"We are currently preparing our store catalog for the AI assistant. Please try again in a few minutes!"*

### FR-4: UI Onboarding Gate
- Update the Onboarding wizard (`Onboard.tsx`) to show embedding progress.
- Disable the final step / dashboard access until progress reaches >= 80%.

### FR-5: UI Products List Embedding Status
- Update `Products.tsx` to read the real `isEmbedded` value returned by the backend and show a visual indicator.

## Scope

### In Scope
- Fastify endpoint additions/modifications in `src/gateway/server.ts`.
- Check in BullMQ inbound processor `src/workers/inboundProcessor.ts`.
- React views in `dashboard/src/pages/Onboard.tsx` and `dashboard/src/pages/Products.tsx`.

### Out of Scope
- Modifying the embedding generation worker itself.
