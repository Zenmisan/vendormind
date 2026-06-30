#!/usr/bin/env bash
# Run once on a fresh Oracle Cloud Ubuntu 22.04 VM
set -e

echo "=== VendorMind Oracle Setup ==="

# ── System deps ───────────────────────────────────────────────
sudo apt-get update -y
sudo apt-get install -y git curl unzip

# ── Docker ────────────────────────────────────────────────────
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER

# ── Bun ───────────────────────────────────────────────────────
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# ── PM2 ───────────────────────────────────────────────────────
bun add -g pm2

# ── Clone repo ────────────────────────────────────────────────
if [ ! -d "vendormind" ]; then
  git clone https://github.com/YOUR_USERNAME/vendormind.git
fi
cd vendormind

# ── Env file ─────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo ">>> Edit .env with your values before continuing:"
  echo "    nano .env"
  echo ""
  echo ">>> Then run: bun run deploy:oracle"
  exit 0
fi

# ── Install deps ─────────────────────────────────────────────
bun install

# ── Start Redis ───────────────────────────────────────────────
docker compose -f docker-compose.oracle.yml up -d

# ── Run Prisma migrations ─────────────────────────────────────
bunx prisma generate
bunx prisma migrate deploy

# ── Open firewall for gateway ─────────────────────────────────
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
# Make persistent
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

echo ""
echo "=== Setup complete. Starting services... ==="
bun run start
