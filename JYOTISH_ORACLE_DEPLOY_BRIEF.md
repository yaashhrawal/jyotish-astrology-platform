# Jyotish App — Oracle Cloud Deployment Brief
# For: Another Claude Instance
# Author: Infrastructure owner (Yash Rawal)
# Date: 2026-08-01
# CONSTRAINT: ZERO new paid resources. Use existing Oracle Always Free VMs only.

---

## YOUR MISSION

Deploy the **Jyotish SaaS app** (Vedic astrology platform) onto the **same Oracle Cloud infrastructure** already running SevaSangraha HMS. Everything must be isolated — separate process, separate database, separate nginx block, separate directory. Never touch SevaSangraha files.

You will:
1. Create `jyotish` database on VM3
2. Deploy FastAPI backend on VM1 at port `:8000`
3. Add nginx server block on VM2 for `jyotish.sevasangrah.in`
4. Get SSL cert on VM2
5. Build React frontend locally → SCP to VM2
6. Run DB schema init

All commands in this doc are ready to execute via Bash tool with `dangerouslyDisableSandbox: true`.

---

## ORACLE CLOUD INFRASTRUCTURE (3 VMs)

### VM1 — API Server
- **Public IP**: `152.67.8.102`
- **Internal IP**: `10.0.1.112`
- **User**: `ubuntu`
- **SSH key**: `~/.ssh/sevasangrah_bastion_key`
- **OS**: Ubuntu 22.04
- **Resources**: 1 OCPU, 1GB RAM, 45GB disk (34GB free)
- **Running**: `sevasangrah-api` (Node.js Express on `:3002`, PM2)
- **Also has**: PostgreSQL hot-standby on `127.0.0.1:5432` (read replica — DO NOT WRITE TO THIS)
- **PgBouncer**: `:6432` (connection pooler)
- **App dir**: `/home/ubuntu/mindcare/` ← SevaSangraha, DO NOT TOUCH

### VM2 — nginx / Static Files
- **Public IP**: `141.148.219.100`
- **User**: `ubuntu`
- **SSH key**: `~/.ssh/sevasangrah_bastion_key`
- **OS**: Ubuntu 22.04
- **Resources**: 1 OCPU, 1GB RAM, 45GB disk (39GB free)
- **nginx** serves all static frontends + reverse-proxies `/api/` to VM1
- **Certbot** manages all SSL (Let's Encrypt)
- **Web roots**: `/var/www/` — each app gets its own subdirectory
- **Nginx config dir**: `/etc/nginx/sites-available/` + `/etc/nginx/sites-enabled/`
- **Existing sites**: magnus, madhuban, bhilwara, staging, demo, trial, solo, indiclabs, provision, ops

### VM3 — PostgreSQL PRIMARY (main database server)
- **Public IP**: `92.4.81.186`
- **Internal IP**: `10.0.1.39`
- **User**: `ubuntu`
- **SSH key**: `~/.ssh/sevasangrah_bastion_key`
- **OS**: Ubuntu 22.04
- **Resources**: ARM 4 OCPU, 24GB RAM, 97GB disk (92GB free) ← PLENTY OF SPACE
- **PostgreSQL 16** on port `5432`
- **Postgres superuser password**: `postgres`
- **Existing DBs**: `sevasangrah` (HMS app), `postgres` (system)
- **Daily backups**: 2am cron → `/home/ubuntu/backups/` (30-day retention)

### SSH access pattern
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102   # VM1
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@141.148.219.100  # VM2
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186     # VM3
```

Run SQL on VM3:
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186 "PGPASSWORD=postgres psql -U postgres -d jyotish -h 127.0.0.1 -c \"SELECT 1\""
```

---

## JYOTISH APP DETAILS

### Stack
- **Backend**: Python FastAPI + uvicorn (async), asyncpg (PostgreSQL driver)
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: PostgreSQL 16 (`jyotish` database — to be created on VM3)
- **AI**: Anthropic Claude API (via `ANTHROPIC_API_KEY`)
- **Auth**: JWT (7-day tokens, bcrypt passwords)
- **Python deps**: fastapi, uvicorn, asyncpg, python-jose, passlib, pyswisseph, anthropic, weasyprint, Jinja2

### Local source paths (on the Mac running this Claude instance)
- **Backend**: `/Users/mac/Desktop/my astro/backend/`
- **Frontend**: `/Users/mac/Desktop/my astro/frontend/`
- **Database schema**: `/Users/mac/Desktop/my astro/database/init.sql`
- **Seed data (gems)**: `/Users/mac/Desktop/my astro/database/seed_gems.sql`

### Ports
- **Jyotish backend**: `:8000` (uvicorn)
- **SevaSangraha backend**: `:3002` (already running — DO NOT TOUCH)

### Domain
- **Production URL**: `https://jyotish.sevasangrah.in`
- **DNS**: Already resolves to VM2 `141.148.219.100` (wildcard `*.sevasangrah.in` or add A record)

### Environment variables for backend
```
DATABASE_URL=postgresql://postgres:postgres@10.0.1.39:5432/jyotish
JWT_SECRET=<generate: openssl rand -hex 64>
ANTHROPIC_API_KEY=<ask owner — they have this key>
ALLOWED_ORIGINS=https://jyotish.sevasangrah.in,http://localhost:5173
UPLOAD_DIR=/home/ubuntu/jyotish/uploads
REPORTS_DIR=/home/ubuntu/jyotish/reports
```

---

## ISOLATION RULES (READ BEFORE DOING ANYTHING)

| Concern | SevaSangraha | Jyotish |
|---|---|---|
| VM1 directory | `/home/ubuntu/mindcare/` | `/home/ubuntu/jyotish/` |
| PM2 process name | `sevasangrah-api` | `jyotish-api` |
| Backend port | `:3002` | `:8000` |
| Database | `sevasangrah` on VM3 | `jyotish` on VM3 |
| Web root on VM2 | `/var/www/magnus` etc | `/var/www/jyotish/` |
| nginx config | `/etc/nginx/sites-available/sevasangrah-*` | `/etc/nginx/sites-available/jyotish` |
| Domain | `*.sevasangrah.in` (HMS) | `jyotish.sevasangrah.in` |

**Never run `pm2 restart sevasangrah-api` or touch `/home/ubuntu/mindcare/`.**

---

## STEP-BY-STEP DEPLOYMENT

### STEP 1 — Create `jyotish` database on VM3

```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186 "PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -c \"CREATE DATABASE jyotish;\""
```

Verify:
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186 "PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -c '\l' | grep jyotish"
```

### STEP 2 — Run schema init on VM3

Copy the schema file to VM3 then run it:
```bash
scp -i ~/.ssh/sevasangrah_bastion_key "/Users/mac/Desktop/my astro/database/init.sql" ubuntu@92.4.81.186:/tmp/jyotish_init.sql

ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186 "PGPASSWORD=postgres psql -U postgres -d jyotish -h 127.0.0.1 -f /tmp/jyotish_init.sql"
```

Run gems seed data:
```bash
scp -i ~/.ssh/sevasangrah_bastion_key "/Users/mac/Desktop/my astro/database/seed_gems.sql" ubuntu@92.4.81.186:/tmp/jyotish_seed_gems.sql

ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186 "PGPASSWORD=postgres psql -U postgres -d jyotish -h 127.0.0.1 -f /tmp/jyotish_seed_gems.sql"
```

### STEP 3 — Set up backend on VM1

**3a — Create directory and copy backend:**
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "mkdir -p /home/ubuntu/jyotish/backend /home/ubuntu/jyotish/uploads /home/ubuntu/jyotish/reports"

rsync -avz -e "ssh -i ~/.ssh/sevasangrah_bastion_key" \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='venv' \
  --exclude='.env' \
  "/Users/mac/Desktop/my astro/backend/" \
  ubuntu@152.67.8.102:/home/ubuntu/jyotish/backend/
```

**3b — Install Python + create venv on VM1:**
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "
  cd /home/ubuntu/jyotish/backend
  python3 -m venv venv
  source venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
"
```

Note: `weasyprint` needs system deps. If pip install fails on weasyprint, run first:
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "sudo apt-get install -y libpango-1.0-0 libpangocairo-1.0-0 libcairo2 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info"
```

**3c — Create .env on VM1:**

IMPORTANT: Ask the infrastructure owner for `ANTHROPIC_API_KEY` before this step. Generate JWT_SECRET yourself.

```bash
JWT=$(openssl rand -hex 64)
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "cat > /home/ubuntu/jyotish/backend/.env << 'ENVEOF'
DATABASE_URL=postgresql://postgres:postgres@10.0.1.39:5432/jyotish
JWT_SECRET=${JWT}
ANTHROPIC_API_KEY=REPLACE_ME
ALLOWED_ORIGINS=https://jyotish.sevasangrah.in,http://localhost:5173
UPLOAD_DIR=/home/ubuntu/jyotish/uploads
REPORTS_DIR=/home/ubuntu/jyotish/reports
ENVEOF"
```

**THEN** update ANTHROPIC_API_KEY:
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "sed -i 's/ANTHROPIC_API_KEY=REPLACE_ME/ANTHROPIC_API_KEY=<ACTUAL_KEY>/' /home/ubuntu/jyotish/backend/.env"
```

**3d — Create PM2 ecosystem file on VM1:**
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "cat > /home/ubuntu/jyotish/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'jyotish-api',
    cwd: '/home/ubuntu/jyotish/backend',
    script: '/home/ubuntu/jyotish/backend/venv/bin/uvicorn',
    args: 'main:app --host 0.0.0.0 --port 8000 --workers 2',
    interpreter: 'none',
    env_file: '/home/ubuntu/jyotish/backend/.env',
    error_file: '/home/ubuntu/jyotish/logs/error.log',
    out_file: '/home/ubuntu/jyotish/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    restart_delay: 3000,
    max_restarts: 10
  }]
}
EOF
mkdir -p /home/ubuntu/jyotish/logs"
```

**3e — Start with PM2:**
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "
  cd /home/ubuntu/jyotish
  pm2 start ecosystem.config.js
  pm2 save
"
```

**3f — Verify backend running:**
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "pm2 list | grep jyotish && curl -s http://localhost:8000/api/health || curl -s http://localhost:8000/docs | head -5"
```

### STEP 4 — Add nginx config on VM2

**4a — Create nginx server block:**
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@141.148.219.100 "sudo tee /etc/nginx/sites-available/jyotish << 'EOF'
server {
    listen 80;
    server_name jyotish.sevasangrah.in;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name jyotish.sevasangrah.in;

    root /var/www/jyotish;
    index index.html;

    # SSL — Certbot will update these
    ssl_certificate /etc/letsencrypt/live/jyotish.sevasangrah.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jyotish.sevasangrah.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # API reverse proxy to VM1 Jyotish backend
    location /api/ {
        proxy_pass http://10.0.1.112:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
        client_max_body_size 20M;
    }

    # Uploads proxy
    location /uploads/ {
        proxy_pass http://10.0.1.112:8000/uploads/;
        expires 30d;
    }

    # Reports proxy
    location /reports/ {
        proxy_pass http://10.0.1.112:8000/reports/;
    }

    # React SPA — serve index.html for all frontend routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
}
EOF"
```

**4b — Create web root and enable site:**
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@141.148.219.100 "
  sudo mkdir -p /var/www/jyotish
  sudo chown ubuntu:ubuntu /var/www/jyotish
  sudo ln -sf /etc/nginx/sites-available/jyotish /etc/nginx/sites-enabled/jyotish
"
```

### STEP 5 — Get SSL certificate on VM2

First get cert (HTTP challenge — needs port 80 active):
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@141.148.219.100 "sudo certbot --nginx -d jyotish.sevasangrah.in --non-interactive --agree-tos -m yashsocial99@gmail.com"
```

If certbot auto-updates the nginx config: verify the config, then reload:
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@141.148.219.100 "sudo nginx -t && sudo systemctl reload nginx"
```

**DNS NOTE**: Before certbot works, `jyotish.sevasangrah.in` must resolve to `141.148.219.100`.
Add an A record in Oracle Cloud DNS (or wherever sevasangrah.in is managed):
```
jyotish.sevasangrah.in  →  A  →  141.148.219.100
```
Ask the owner to add this DNS record if not already present.

### STEP 6 — Build frontend and deploy to VM2

**6a — Build locally:**
```bash
cd "/Users/mac/Desktop/my astro/frontend"
VITE_API_URL=https://jyotish.sevasangrah.in npm run build
```

**6b — Upload to VM2:**
```bash
rsync -avz --delete -e "ssh -i ~/.ssh/sevasangrah_bastion_key" \
  "/Users/mac/Desktop/my astro/frontend/dist/" \
  ubuntu@141.148.219.100:/var/www/jyotish/
```

**6c — Reload nginx:**
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@141.148.219.100 "sudo nginx -t && sudo systemctl reload nginx"
```

### STEP 7 — Smoke test

```bash
# Backend health via nginx
curl -s https://jyotish.sevasangrah.in/api/health

# Frontend loads
curl -s -o /dev/null -w "%{http_code}" https://jyotish.sevasangrah.in/
# Should return 200

# SevaSangraha still working (verify no breakage)
curl -s -o /dev/null -w "%{http_code}" https://magnus.sevasangrah.in/
# Should return 200
```

---

## FIREWALL NOTE

VM1 has Oracle Cloud security groups. Port `:8000` may need to be opened for VM2 internal traffic.
VM2 → VM1 communication is on internal VCN (`10.0.1.x`) — should already be open.
If backend calls fail from nginx, run on VM1:
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "sudo iptables -I INPUT -p tcp --dport 8000 -s 10.0.1.0/24 -j ACCEPT && sudo netfilter-persistent save"
```

---

## FUTURE DEPLOYS (after initial setup)

### Backend update
```bash
rsync -avz -e "ssh -i ~/.ssh/sevasangrah_bastion_key" \
  --exclude='__pycache__' --exclude='*.pyc' --exclude='venv' --exclude='.env' \
  "/Users/mac/Desktop/my astro/backend/" \
  ubuntu@152.67.8.102:/home/ubuntu/jyotish/backend/

ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "pm2 restart jyotish-api"
```

### Frontend update
```bash
cd "/Users/mac/Desktop/my astro/frontend"
VITE_API_URL=https://jyotish.sevasangrah.in npm run build

rsync -avz --delete -e "ssh -i ~/.ssh/sevasangrah_bastion_key" \
  "/Users/mac/Desktop/my astro/frontend/dist/" \
  ubuntu@141.148.219.100:/var/www/jyotish/
```

### Run DB migration
```bash
scp -i ~/.ssh/sevasangrah_bastion_key "/Users/mac/Desktop/my astro/database/migrations/XXXX.sql" ubuntu@92.4.81.186:/tmp/
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186 "PGPASSWORD=postgres psql -U postgres -d jyotish -h 127.0.0.1 -f /tmp/XXXX.sql"
```

---

## RESOURCE SNAPSHOT (as of 2026-08-01)

| VM | CPU | RAM Total | RAM Free | Disk Free |
|---|---|---|---|---|
| VM1 (API) | 1 OCPU | 954MB | ~192MB + 4GB swap | 34GB |
| VM2 (nginx) | 1 OCPU | 954MB | ~197MB | 39GB |
| VM3 (DB) | 4 ARM OCPU | 24GB | ~22GB | 92GB |

VM1 RAM is the tightest. sevasangrah-api uses 51MB. uvicorn with 2 workers uses ~100-150MB. Total: ~250MB — within limits. If memory pressure, reduce uvicorn to `--workers 1`.

---

## WHAT TO ASK OWNER IF STUCK

1. **ANTHROPIC_API_KEY** — they have it, not in repo
2. **DNS A record** — needs to be added for `jyotish.sevasangrah.in → 141.148.219.100`
3. **Ephemeris files** — if pyswisseph fails, may need Swiss Ephemeris data files in `/home/ubuntu/jyotish/backend/ephemeris/`

---

## GOLDEN RULE

> Zero paid Oracle resources. Everything runs on existing 3 VMs.
> Never touch `/home/ubuntu/mindcare/` or `sevasangrah-api` PM2 process.
> Separate DB, separate port, separate directory, separate nginx block.
