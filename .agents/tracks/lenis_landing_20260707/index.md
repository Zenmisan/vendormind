# Track: Lenis Smooth Scroll Landing Page

**Status:** Completed  
**Date:** 2026-07-07

## Approach
Lenis core (smooth inertia scroll) + IntersectionObserver section reveals. No GSAP.

## Tasks
- [x] Install `lenis@1.3.25`
- [x] Init Lenis in Landing (lerp 0.08, duration 1.2) + cleanup on unmount
- [x] `useScrollReveal` + `useStaggerReveal` hooks — `src/lib/useScrollReveal.ts`
- [x] CSS classes: `.reveal-block`, `.stagger-container`, `.hero-word` + `@keyframes heroWordIn`
- [x] Hero h1: word-by-word staggered fade-up on load (80ms per word)
- [x] Navbar: fades to opaque + stronger blur as user scrolls past 60px
- [x] Stats bar: stagger-in
- [x] Pain points cards: stagger-in
- [x] Audience pills: stagger-in
- [x] How it works steps: stagger-in
- [x] Features grid: stagger-in
- [x] Pricing card: reveal-block
- [x] FAQ items: stagger-in
- [x] `prefers-reduced-motion` guard in CSS
- [x] Build passes (1.99s, no errors)
