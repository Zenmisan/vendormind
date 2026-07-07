# Spec: VendorMind Product Build Phase 1

## Goal
Build a fully functional vendor dashboard for the VendorMind WhatsApp AI sales agent platform.

## Surfaces
- Vendor Dashboard (web app, Firebase Hosting)
- Backend API (Fastify, Render free tier)

## Pages Built
1. Landing — Firebase auth Google Sign-In
2. Onboard — 5-step wizard (profile, catalog, persona, WhatsApp, wallet)
3. Dashboard — live stats, recent orders, WA status, wallet health
4. Products — catalog CRUD, CSV upload, embedding status
5. Orders — list, detail drawer, status override, CSV export
6. Conversations — two-panel inbox, message bubbles, handoff toggle
7. Wallet — balance, transaction history, top-up
8. Settings — profile, agent persona, danger zone tabs

## Backend Endpoints Added
- GET/POST /vendors/:id/settings
- GET /vendors/:id/wallet
- GET /vendors/:id/conversations
- GET /vendors/:id/conversations/:sid
- POST /vendors/:id/conversations/:sid/handoff
- POST /vendors/:id/products
- PUT /vendors/:id/products/:pid
- DELETE /vendors/:id/products/:pid
- POST /vendors/:id/whatsapp/pair
- GET /vendors/:id/whatsapp/pairing-code
