# Database Setup & Pgvector Migration Guide

Guide for configuring PostgreSQL, enabling the `pgvector` extension, and running Prisma migrations for VendorMind.

---

##  PostgreSQL Setup with pgvector

VendorMind relies on vector similarity search for semantic catalog lookup.

### Installing pgvector

#### macOS (Homebrew)
```bash
brew install pgvector
```

#### Ubuntu / Debian
```bash
sudo apt-get install postgresql-15-pgvector
```

#### Docker
```bash
docker run --name vendormind-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d ankane/pgvector
```

---

##  Enabling Extension in Database

Run SQL in your PostgreSQL instance:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 🔄 Prisma Commands

```bash
# Push schema changes
bunx prisma db push

# Generate client
bunx prisma generate

# Seed sample vendor & product catalog
bun run prisma/seed.ts
```
