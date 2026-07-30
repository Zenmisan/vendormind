# Backend Deployment Guide (Render / Docker)

Guide for deploying the VendorMind Fastify API Gateway & WhatsApp Fleet Service.

---

##  Deploying on Render

VendorMind includes a production `render.yaml` specification.

1. Connect your GitHub repository to Render.
2. Select **New Blueprint Instance**.
3. Render automatically detects `render.yaml` and provisions:
   - Web Service (Fastify gateway on Node 20 / Bun)
   - PostgreSQL Instance (with pgvector enabled)

---

## 🐳 Docker Deployment

To build and run the Docker image manually:

```bash
# Build Docker image
docker build -t vendormind-gateway .

# Run container
docker run -p 3000:3000 --env-file .env vendormind-gateway
```
