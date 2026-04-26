#!/usr/bin/env bash
# =================================================================
# Jyotish SaaS — Deploy update (run on Oracle VM)
# Pull latest code, rebuild frontend, restart backend
# =================================================================
set -euo pipefail

APP_DIR="/home/ubuntu/jyotish"
FRONTEND_DIST="/var/www/jyotish"

echo "==> Pull latest"
cd "$APP_DIR"
git pull

echo "==> Backend: install any new deps"
cd "$APP_DIR/backend"
source venv/bin/activate
pip install -q -r requirements.txt

echo "==> Restart backend"
sudo systemctl restart jyotish-backend
sleep 2
sudo systemctl is-active jyotish-backend && echo "Backend: OK" || echo "Backend: FAILED"

echo "==> Frontend: install + build"
cd "$APP_DIR/frontend"
npm ci --silent
npm run build

echo "==> Copy dist to nginx root"
sudo rsync -a --delete dist/ "$FRONTEND_DIST/"

echo "==> Reload nginx"
sudo systemctl reload nginx

echo ""
echo "Deploy complete."
