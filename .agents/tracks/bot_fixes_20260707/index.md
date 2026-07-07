# Track: Bot Generic Replies + Message Delivery Fix

**Status:** Completed  
**Date:** 2026-07-07

## Root causes
1. `sock.ev.listenerCount` doesn't exist in this Baileys version → crash in disconnect handler → socket instability
2. Claude API out of credits, Gemini free quota exhausted, Groq tool call format malformed → mock fallback

## Fixes
- [x] Fleet worker: replaced `sock.ev.listenerCount('connection.update')` with local `reconnectCount` var
- [x] AI service Groq: switched to `meta-llama/llama-4-scout-17b-16e-instruct`, added `parallel_tool_calls: false`, retry without tools on 400 error
- [x] Restarted fleet-worker + inbound-processor

## Outstanding (not code)
- Claude API needs credit top-up at console.anthropic.com — Groq fallback now works but Claude gives better responses
- Gemini free tier: 20 req/day limit — consider adding billing
