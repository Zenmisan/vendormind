# Environment Variables

Copy `.env` and fill in the values marked required.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Postgres connection string |
| `REDIS_URL` | ✅ | — | Redis connection string |
| `PORT` | | `3000` | Fastify gateway port |
| `LOG_LEVEL` | | `info` | Pino log level (`debug`/`info`/`warn`/`error`) |
| `NODE_ENV` | | `development` | `development` or `production` |
| `VENDOR_ID` | ✅ | `1` | Which vendor this fleet worker serves. Set per PM2 app entry. |
| `ANTHROPIC_API_KEY` | ✅ | — | Claude Sonnet/Haiku — primary LLM + summarization |
| `GROQ_API_KEY` | ✅ | — | Groq Whisper (voice transcription) + Llama fallback LLM |
| `GEMINI_API_KEY` | | — | Gemini fallback LLM (optional) |
| `NOMBA_CLIENT_ID` | | — | Nomba API client ID for checkout |
| `NOMBA_CLIENT_SECRET` | | — | Nomba API client secret for checkout |
| `NOMBA_ACCOUNT_ID` | | — | Nomba account ID used when creating checkout orders |
| `NOMBA_WEBHOOK_SECRET` | | — | Nomba webhook secret for signature verification |
| `NOMBA_BASE_URL` | | `https://api.nomba.com` | Nomba API base URL |
| `OPENAI_API_KEY` | | — | OpenAI embeddings (`text-embedding-3-small`) — required for pgvector search |
| `SMTP_HOST` | | — | SMTP server for wallet warning emails (not yet implemented) |
| `SMTP_USER` | | — | SMTP username |
| `SMTP_PASS` | | — | SMTP password |

## Notes

**`ANTHROPIC_API_KEY` detection**: The inbound processor checks if the key contains `...` to decide mock vs real LLM. Replace the placeholder entirely.

**Nomba credentials**: Create API keys in the Nomba dashboard and set `NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET`, `NOMBA_ACCOUNT_ID`, and `NOMBA_WEBHOOK_SECRET`. The webhook handler verifies signed payment events.

**`OPENAI_API_KEY`**: Only needed if you want semantic product/document search. Without it, `searchDocuments` falls back to SQL `LIKE` matching.

**`VENDOR_ID`**: For local dev, leave as `1`. For production with multiple vendors, set this per PM2 app in `ecosystem.config.cjs`:
```js
{ name: 'vm-fleet-vendor-2', script: 'src/fleet/worker.ts', env: { VENDOR_ID: '2' } }
```

## Docker Compose defaults

The `docker-compose.yml` starts Postgres and Redis with these credentials:
```
DATABASE_URL=postgresql://user:password@127.0.0.1:5432/vendormind?schema=public
REDIS_URL=redis://127.0.0.1:6379
```
These already match the `.env` defaults — no changes needed for local dev.
