# VendorMind — Agent Tracks

## Active Tracks

- [monnify-migration](tracks/monnify_migration_20260720/) — Monnify Payment Gateway Migration: Replace Nomba payment provider with Monnify for transaction initialization, webhook signatures, and wallet top-ups.

## Completed Tracks

- [routing-and-auth-fixes](tracks/routing_and_auth_fixes_20260714/) — Routing & WhatsApp Auth fixes: Fixed JID phone formatting symbols (+), added robust Baileys auth state checks, ignored group/newsletter chats at connection-level, and resolved keep-alive ping URL routing.
- [pwa](tracks/pwa_20260707/) — PWA: installable on mobile + desktop, manifest, service worker, icons, offline cache
- [conversation-filters](tracks/conversation_filters_20260707/) — Conversation Filters & Stand-down: Added recursive WhatsApp message formatting parsing and LLM classifier to stand down on casual personal/friend chats.
- [link-previews](tracks/link_previews_20260707/) — Link Previews (Open Graph Metadata): Added Open Graph and Twitter Card tags to index.html using the logo image for rich preview embeds.
- [catalog-fuzzy-ingest](tracks/catalog_fuzzy_ingest_20260707/) — Fuzzy column detection for catalog Excel upload — any header format works now
- [payments-upgrades](tracks/payments_upgrades_20260707/) — Nomba Payment & Top-up Dropdown Upgrades: URL normalization, Naira-to-Kobo amount scaling, and styled wallet top-up select dropdown.
- [theme-and-filters](tracks/theme_and_filters_20260707/) — Theme Toggle & Orders Filters: global light/dark mode switch, filter pills text visibility bugfix, and PostgreSQL case-insensitive raw query fixes.
- [frontend-redesign](tracks/frontend_redesign_20260706/) — Frontend Redesign: complete reconfiguration of landing, onboarding, sidebar, chat inbox, and catalog pages with new branding logos.
- [dashboard-upgrades](tracks/dashboard_upgrades_20260706/) — Dashboard upgrades: interactive human handoff chat, vertical onboard stepper, and layout polish
- [onboarding-gate](tracks/onboarding_gate_20260706/) — Onboarding Gate: block vendor go-live until >80% products embedded
- [product-build-phase1](tracks/product_build_20260706/) — Full dashboard build: all pages, backend endpoints, WhatsApp auth, agent persona, wallet, settings, Render + Firebase deploy
- [multi-vendor-nomba-landing](tracks/multi_vendor_nomba_20260706/) — Multi-vendor fleet, Nomba checkout, landing login link
- [wa-disconnect-fix](tracks/wa_disconnect_fix_20260706/) — WA disconnect writes connected:false to DB, dashboard polls status every 30s
- [wa-reconnect-modal](tracks/wa_reconnect_modal_20260707/) — Reconnect modal on Dashboard with QR + phone pairing, no onboarding redirect
- [lenis-landing](tracks/lenis_landing_20260707/) — Lenis smooth scroll + hero word reveal + section stagger reveals on landing page
- [responsive-fix](tracks/responsive_fix_20260707/) — Full responsive pass: overflow, chat mockup, grids, nav, typography, section padding
