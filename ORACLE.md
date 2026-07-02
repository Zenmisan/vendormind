# Oracle VM Setup

Covers VendorMind and any future Bun + PM2 + Redis backend on the same VM.

---

## 1. Provision VM (Oracle Cloud Console)

- Shape: **VM.Standard.A1.Flex** (Ampere, free tier) — 4 OCPU / 24 GB RAM recommended
- Image: **Ubuntu 22.04 Minimal**
- Boot volume: 50 GB+
- Add SSH key at creation time

### Open ports (VCN Security List → Ingress Rules)

| Protocol | Port | Source | Purpose |
|---|---|---|---|
| TCP | 22 | 0.0.0.0/0 | SSH |
| TCP | 80 | 0.0.0.0/0 | HTTP (nginx) |
| TCP | 443 | 0.0.0.0/0 | HTTPS (nginx) |
| TCP | 3000 | 127.0.0.1/32 | Backend gateway (internal only) |

Also open them in the **OS firewall** (Ubuntu's `iptables` blocks by default even when OCI rules allow):

```bash
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## 2. First Login & System Setup

```bash
ssh ubuntu@<VM_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Essential packages
sudo apt install -y git curl unzip nginx certbot python3-certbot-nginx \
  netfilter-persistent iptables-persistent build-essential
```

---

## 3. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc   # or ~/.zshrc
bun --version      # confirm
```

---

## 4. Install Docker (for Redis)

```bash
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER
newgrp docker       # reload group without logout
docker --version
```

---

## 5. Install PM2

```bash
# PM2 needs Node for its own process manager binary
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
pm2 --version

# Auto-start PM2 on reboot
pm2 startup        # copy and run the printed sudo command
```

---

## 6. Clone & Configure the Project

```bash
cd ~
git clone https://github.com/zenmisan/vendormind.git
cd vendormind

# Install dependencies
bun install

# Copy and fill .env
cp .env.example .env
nano .env
```

### Required `.env` values for Oracle deployment

```env
NODE_ENV=production
PORT=3000

DATABASE_URL="postgresql://..."       # Supabase session pooler (IPv4) — see below
DIRECT_URL="postgresql://..."         # Same as DATABASE_URL for Supabase pooler

REDIS_URL="redis://127.0.0.1:6379"

ANTHROPIC_API_KEY="sk-ant-..."
GROQ_API_KEY="gsk_..."

NOMBA_CLIENT_ID="..."
NOMBA_CLIENT_SECRET="..."
NOMBA_PARENT_ACCOUNT_ID="..."
NOMBA_SUB_ACCOUNT_ID="..."
NOMBA_BASE_URL="https://api.nomba.com/v1"

VENDOR_ID="4"                         # ID from vendors table for this instance
```

#### Supabase connection string (IPv4 — required for Oracle VM)

Oracle VMs only route IPv4. Use the **Session Pooler** URL, not the Direct URL:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Found in: Supabase Dashboard → Project → Settings → Database → Connection string → Session pooler.

Encode special chars in password: `@` → `%40`, `#` → `%23`.

---

## 7. Start Redis

```bash
docker compose -f docker-compose.oracle.yml up -d
docker ps   # confirm redis is running
```

---

## 8. Run DB Migrations

```bash
bunx prisma generate
bunx prisma migrate deploy
```

---

## 9. Start Backend with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save        # persist process list across reboots
pm2 status      # confirm all processes are online
```

Useful commands:

```bash
pm2 logs                          # tail all logs
pm2 logs vm-fleet-worker          # single process
pm2 restart vm-gateway            # restart one
pm2 restart ecosystem.config.cjs --update-env   # reload all + env changes
pm2 stop all && pm2 delete all    # teardown
```

---

## 10. HTTPS with nginx + Certbot

Point your domain's A record to the VM public IP first, then:

```bash
# Create nginx config for your domain
sudo nano /etc/nginx/sites-available/vendormind
```

```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/vendormind /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Issue TLS cert (auto-renews via cron)
sudo certbot --nginx -d api.yourdomain.com
```

---

## Adding a Second Project on the Same VM

Each project needs its own port and nginx block. Everything else is shared (Bun, Docker, PM2, certbot).

### Steps

1. Clone to `~/projects/<name>`
2. Copy `.env.example` → `.env`, fill values (use a different `PORT`, e.g. `3001`)
3. Start Redis (same Docker container is fine if both use default Redis — or run a second compose stack with a mapped port like `6380:6379`)
4. Run `bunx prisma migrate deploy` inside the new project
5. Start with PM2: `pm2 start ecosystem.config.cjs --name <project>` (add `--prefix-name` if ecosystem names clash)
6. Save: `pm2 save`
7. Add nginx block for the new domain proxying to the new port
8. Issue cert: `sudo certbot --nginx -d <new-domain>`

### Port allocation (suggested)

| Port | Project |
|---|---|
| 3000 | vendormind |
| 3001 | next project |
| 3002 | … |

---

## Troubleshooting

**PM2 process crashes on start**
```bash
pm2 logs <name> --lines 50
```
Common causes: missing `.env` value, `bunx prisma generate` not run, Redis not up.

**Cannot connect to Supabase from VM**
```bash
curl -v postgresql://...  # won't work but confirms DNS resolves
node -e "require('dns').resolve4('aws-0-eu-west-1.pooler.supabase.com', console.log)"
```
If it resolves to `2a05:...` (IPv6), you're on the wrong URL — use the session pooler.

**Port 3000 unreachable from outside**
Check both layers:
```bash
sudo iptables -L INPUT -n | grep 3000   # OS firewall
# Also check OCI Console → VCN → Security List → Ingress rules
```
Gateway should only be on `127.0.0.1:3000` anyway — nginx handles public traffic.

**Redis `ECONNREFUSED`**
```bash
docker ps | grep redis
docker start <redis-container-id>
```

**`Cannot find module '.prisma/client/default'`**
```bash
bunx prisma generate
pm2 restart all
```
