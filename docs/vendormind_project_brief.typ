#set page(
  paper: "a4",
  margin: (x: 2.5cm, y: 2.5cm),
  header: align(right, text(fill: rgb("#4b5563"), size: 9pt)[VendorMind Project Brief]),
  footer: [
    #set text(fill: rgb("#4b5563"), size: 9pt)
    #grid(
      columns: (1fr, 1fr),
      [DevCareer x Nomba Hackathon 2026],
      align(right, context counter(page).display())
    )
  ]
)

#set text(
  font: "Liberation Sans",
  size: 11pt,
  fill: rgb("#111827"),
)

#show heading: set text(fill: rgb("#16a34a"))
#show heading.where(level: 1): it => {
  v(1.5em, weak: true)
  it
  v(0.8em, weak: true)
}

// Title Section
#align(center)[
  #block(width: 100%, stroke: none, inset: 2em)[
    #text(size: 28pt, weight: "bold", fill: rgb("#111827"))[VendorMind] \
    #v(0.5em)
    #text(size: 14pt, style: "italic", fill: rgb("#4b5563"))[Autonomous WhatsApp Conversational Commerce]
  ]
]

#v(1em)

// Meta Grid
#grid(
  columns: (1fr, 1fr),
  gutter: 1.5em,
  [
    *Author:* Akin-David Ireyemi (Team Lead) \
    *Email:* zenmisan\@gmail.com \
    *Github:* https://github.com/Zenmisan/vendormind
  ],
  [
    *Date:* July 7, 2026 \
    *Status:* Fully Functional Beta \
    *URL:* vendormind-z.web.app
  ]
)

#line(length: 100%, stroke: 0.5pt + rgb("#e5e7eb"))

#v(1em)

= Executive Summary

VendorMind is a next-generation conversational commerce platform that enables merchants to sell products and accept secure payments directly inside WhatsApp. By combining a brand-tailored LLM sales assistant with *Nomba Online Checkout*, VendorMind removes checkout friction entirely—eliminating app downloads, registrations, and external web redirects for consumers.

= The Problem

Mobile commerce is plagued by several points of friction:
- *App Fatigue:* Over 80% of consumers abandon purchases when forced to download a new application or register a web account.
- *Manual Overhead:* Small-to-medium businesses spend hours manually updating inventory, checking stock levels, calculating shipping rates, and verifying payment alerts in chat.
- *Disjointed Payment Experiences:* Direct payments in messaging apps are non-existent, forcing consumers to navigate through slow web interfaces.

= The Solution: VendorMind

VendorMind connects directly to a vendor's WhatsApp number and handles transactions autonomously:
1. *Semantic Catalog Browsing:* Customers query the catalog using natural, casual sentences (e.g. _"Do you have anything sweet?"_), processed via vector embeddings.
2. *Real-time Cart Management:* Automated addition/removal of products and temporary stock reservations.
3. *Direct Checkout Links:* Instantly creates secure Nomba Checkout Order URLs containing the exact cart total in Naira.
4. *Payment Webhooks:* Automatically listens for Nomba's `payment_success` webhooks to mark orders paid, release reserves, update inventory levels, and send receipts.

= Core System Features

== 1. Hybrid Merchant Dashboard
A premium PWA dashboard with a dark/light switcher that features a vertical onboarding wizard, WhatsApp pairing/QR codes, Excel bulk catalog uploading, and real-time wallet tracking.

== 2. Interactive Human Handoff
If a customer requires human assistance or if the vendor intervenes, the bot automatically pauses and locks itself out, transitioning the session to a human operator in the live chat inbox.

== 3. Intelligent Conversation Guardrails
A dedicated classification model separates business inquiries from casual personal chat. If a family member or friend messages the vendor, the bot stands down immediately without charging any processing credits.

= Tech Stack

- *Frontend:* React, Vite, CSS variables, PWA (Vite PWA plugin), Lucide Icons, Lenis Smooth Scroll
- *Backend REST API:* Fastify (Node.js/TypeScript)
- *Queue & Event Processing:* BullMQ & Redis (5 concurrent background workers)
- *Database & ORM:* PostgreSQL with Prisma ORM
- *WhatsApp integration:* Baileys Multi-Device Socket SDK
- *AI Orchestration:* Anthropic Claude-Sonnet-4.6, Google Gemini 2.5, and Groq Audio Whisper
- *Payments API:* Nomba Checkout & Auth Gateway
