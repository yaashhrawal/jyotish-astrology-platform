# Jyotish Oracle Deploy — CORRECTED Runbook (DRY-RUN, not executed)

Based on the owner's brief, with fixes for real-code discrepancies. Nothing here has been run.
Key decision applied: **ANTHROPIC_API_KEY skipped** — deploy with placeholder; AI endpoints stay down until you add it later.

SSH key: `~/.ssh/sevasangrah_bastion_key` · VM1 `152.67.8.102` (10.0.1.112) · VM2 `141.148.219.100` · VM3 `92.4.81.186` (10.0.1.39)

---

## ✅ CORRECTIONS vs the original brief
1. **DB init was incomplete** — brief ran only `init.sql` + `seed_gems.sql`. Correct order is **6 files**; `seed_gems` MUST come after `003` or it errors (no gem tables).
2. **Health check** — there is no `/api/health` route. Backend root is `GET /` → `{"status":"Jyotish Engine v2.0 running"}`. Smoke-test that, plus a real `/api/calc/*` call through nginx.
3. **uvicorn workers** — VM1 has ~192MB free RAM. Start with **`--workers 1`** (brief's 2 may OOM); bump later if stable.
4. React is **19** (brief said 18) — no action, just FYI.
5. `.env` correctly excluded from rsync; `ANTHROPIC_API_KEY=REPLACE_ME` left as placeholder.

---

## STEP 1 — Create DB (VM3)
```bash
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186 "PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -c \"CREATE DATABASE jyotish;\""
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186 "PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -c '\l' | grep jyotish"
```

## STEP 2 — Schema + migrations + seed (VM3) — CORRECTED ORDER
```bash
BASE="/Users/mac/Desktop/my astro/database"
for f in init.sql migrations/002_business_modules.sql migrations/003_gem_marketplace.sql seed_gems.sql migrations/004_user_role.sql migrations/005_board_layout.sql; do
  scp -i ~/.ssh/sevasangrah_bastion_key "$BASE/$f" ubuntu@92.4.81.186:/tmp/jyotish_$(basename "$f")
  ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186 "PGPASSWORD=postgres psql -U postgres -d jyotish -h 127.0.0.1 -v ON_ERROR_STOP=1 -f /tmp/jyotish_$(basename "$f")"
done
# verify tables
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@92.4.81.186 "PGPASSWORD=postgres psql -U postgres -d jyotish -h 127.0.0.1 -c '\dt' | grep -E 'users|charts|clients|gem_catalog|gem_orders'"
```

## STEP 3 — Backend on VM1
```bash
# 3a dirs + code (excludes venv/.env/pycache)
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "mkdir -p /home/ubuntu/jyotish/backend /home/ubuntu/jyotish/uploads /home/ubuntu/jyotish/reports /home/ubuntu/jyotish/logs"
rsync -avz -e "ssh -i ~/.ssh/sevasangrah_bastion_key" --exclude='__pycache__' --exclude='*.pyc' --exclude='venv' --exclude='.env' \
  "/Users/mac/Desktop/my astro/backend/" ubuntu@152.67.8.102:/home/ubuntu/jyotish/backend/

# 3b weasyprint system deps, then venv + pip
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "sudo apt-get update && sudo apt-get install -y python3-venv libpango-1.0-0 libpangocairo-1.0-0 libcairo2 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info"
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "cd /home/ubuntu/jyotish/backend && python3 -m venv venv && ./venv/bin/pip install --upgrade pip && ./venv/bin/pip install -r requirements.txt"

# 3c .env (JWT generated; ANTHROPIC left as placeholder per decision)
JWT=$(openssl rand -hex 64)
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "cat > /home/ubuntu/jyotish/backend/.env << ENVEOF
DATABASE_URL=postgresql://postgres:postgres@10.0.1.39:5432/jyotish
JWT_SECRET=${JWT}
ANTHROPIC_API_KEY=REPLACE_ME
ALLOWED_ORIGINS=https://jyotish.sevasangrah.in,http://localhost:5173
UPLOAD_DIR=/home/ubuntu/jyotish/uploads
REPORTS_DIR=/home/ubuntu/jyotish/reports
ENVEOF"

# 3d PM2 (workers=1 for RAM) — uvicorn from venv
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "cat > /home/ubuntu/jyotish/ecosystem.config.js << 'EOF'
module.exports = { apps: [{
  name: 'jyotish-api', cwd: '/home/ubuntu/jyotish/backend',
  script: '/home/ubuntu/jyotish/backend/venv/bin/uvicorn',
  args: 'main:app --host 0.0.0.0 --port 8000 --workers 1',
  interpreter: 'none', env_file: '/home/ubuntu/jyotish/backend/.env',
  error_file: '/home/ubuntu/jyotish/logs/error.log', out_file: '/home/ubuntu/jyotish/logs/out.log',
  restart_delay: 3000, max_restarts: 10 }] }
EOF"

# 3e start + save
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "cd /home/ubuntu/jyotish && pm2 start ecosystem.config.js && pm2 save"

# 3f verify — CORRECTED health check (root '/', not /api/health)
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@152.67.8.102 "pm2 list | grep jyotish; curl -s http://localhost:8000/"
```

## STEP 4 — nginx block (VM2)  [same as brief; unchanged]
_(create /etc/nginx/sites-available/jyotish, mkdir /var/www/jyotish, symlink to sites-enabled — verbatim from brief §4a/4b)_

## STEP 5 — SSL (VM2) — ONLY if DNS resolves
```bash
# prereq: jyotish.sevasangrah.in must A-record → 141.148.219.100. Verify:
dig +short jyotish.sevasangrah.in
# then:
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@141.148.219.100 "sudo certbot --nginx -d jyotish.sevasangrah.in --non-interactive --agree-tos -m yashsocial99@gmail.com && sudo nginx -t && sudo systemctl reload nginx"
```
If DNS not live yet: do Steps 1–4 + 6 now, run Step 5 after propagation.

## STEP 6 — Frontend build + deploy (VM2)
```bash
cd "/Users/mac/Desktop/my astro/frontend"
VITE_API_URL=https://jyotish.sevasangrah.in npm run build
rsync -avz --delete -e "ssh -i ~/.ssh/sevasangrah_bastion_key" \
  "/Users/mac/Desktop/my astro/frontend/dist/" ubuntu@141.148.219.100:/var/www/jyotish/
ssh -i ~/.ssh/sevasangrah_bastion_key ubuntu@141.148.219.100 "sudo nginx -t && sudo systemctl reload nginx"
```

## STEP 7 — Smoke test — CORRECTED
```bash
curl -s https://jyotish.sevasangrah.in/api/calc/panchanga -X POST -H 'Content-Type: application/json' \
  -d '{"year":2000,"month":2,"day":1,"hour":12,"minute":35,"tz_offset":5.5,"latitude":24.58,"longitude":73.68,"ayanamsa":"lahiri"}' -o /dev/null -w "api → %{http_code}\n"
curl -s -o /dev/null -w "frontend → %{http_code}\n" https://jyotish.sevasangrah.in/
curl -s -o /dev/null -w "sevasangrah intact → %{http_code}\n" https://magnus.sevasangrah.in/
```

## Known caveats
- AI endpoints (`/api/ai/*`) will 500 until `ANTHROPIC_API_KEY` is set (your choice to skip).
- `/reports/` proxy: backend mounts `/uploads` (StaticFiles) but confirm `/reports` is mounted before relying on it.
- VM1 RAM tight — watch `pm2 monit`; keep workers=1.
- Firewall: if nginx→VM1:8000 fails, open it for the VCN (brief §Firewall).
