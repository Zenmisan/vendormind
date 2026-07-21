# VendorMind — Agent Tracks

## Active Tracks

*(none)*

## Completed Tracks

- [monnify-advanced-features](tracks/monnify_advanced_features_20260721/) — Advanced Monnify Features: Implemented Customer Reserved Account bank transfers, automated refunds, and payment splitting.

- [pitch-deck-pdf-generation](tracks/pitch_deck_pdf_generation_20260721/) — Investor Pitch Deck & Puppeteer PDF Generation: Created sleek 16:9 HTML presentation deck and rendered PDF via Puppeteer with Chromium.

- [whatsapp-qr-pairing-sync-fix](tracks/whatsapp_qr_pairing_sync_fix_20260721/) — WhatsApp QR & Pairing Sync Fix: Redis control pub/sub to force Baileys socket restart for fresh QR and pairing code generation.

- [full-app-responsiveness](tracks/full_app_responsiveness_20260721/) — Full App Mobile Responsiveness Overhaul: Centralized CSS grid classes, media queries, flex-wrap chips, and mobile card layouts across all pages.

- [pricing-cards-alignment](tracks/pricing_cards_alignment_20260721/) — Pricing Cards CTA Alignment: Flexbox column layout and marginTop auto on buttons for symmetrical alignment.

- [groq-model-name-fix](tracks/groq_model_name_fix_20260721/) — AI Provider Model Identifiers Fix: Replaced invalid model names with official production models (llama-3.3-70b-versatile, claude-3-5-sonnet-20241022, gemini-1.5-flash).

- [db-connection-resilience](tracks/db_connection_resilience_20260721/) — DB Connection Resilience & Fleet Retry: Added SSL options and pool timeouts to pg.Pool, and retry loop to fleet startup.

- [scroll-to-top-fix](tracks/scroll_to_top_fix_20260720/) — Scroll-to-Top Route Navigation Fix: Automatically reset window scroll position to top (0, 0) on React Router navigation.

- [landing-and-legal-pages-upgrade](tracks/landing_and_legal_pages_upgrade_20260720/) — Landing & Legal Pages Upgrade: Purge Nomba copy, add stylish contact form, and expand comprehensive Terms and Privacy Policy.

- [whatsapp-delivery-and-smart-filter](tracks/whatsapp_delivery_and_smart_filter_20260720/) — WhatsApp Delivery & Smart Filter: WebSocket connection state checks, manual message DB creation, and smart customer classifier to ignore personal chit-chat.
- [monnify-migration](tracks/monnify_migration_20260720/) — Monnify Payment Gateway Migration: Replace Nomba payment provider with Monnify for transaction initialization, webhook signatures, and wallet top-ups.

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
