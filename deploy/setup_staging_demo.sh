#!/usr/bin/env bash
# =================================================================
# Set up staging (port 8889) and demo (port 8890) services
# Run AFTER setup_oracle_vm.sh (which sets up production on 8888)
# =================================================================
set -euo pipefail

APP_DIR="/home/ubuntu/jyotish"

echo "==> Creating staging database"
sudo -u postgres psql -c "
  CREATE DATABASE jyotish_staging OWNER jyotish;
" 2>/dev/null || echo "  (already exists)"
PGPASSWORD="${STAGING_DB_PASSWORD:-changeme}" psql -U jyotish -d jyotish_staging -h 127.0.0.1 \
  -f "$APP_DIR/database/init.sql"

echo "==> Creating demo database"
sudo -u postgres psql -c "
  CREATE DATABASE jyotish_demo OWNER jyotish;
" 2>/dev/null || echo "  (already exists)"
PGPASSWORD="${DEMO_DB_PASSWORD:-changeme}" psql -U jyotish -d jyotish_demo -h 127.0.0.1 \
  -f "$APP_DIR/database/init.sql"
PGPASSWORD="${DEMO_DB_PASSWORD:-changeme}" psql -U jyotish -d jyotish_demo -h 127.0.0.1 \
  -f "$APP_DIR/database/demo_seed.sql"

echo "==> Staging systemd service (port 8889)"
sudo tee /etc/systemd/system/jyotish-backend-staging.service > /dev/null <<EOF
[Unit]
Description=Jyotish FastAPI Backend (Staging)
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${APP_DIR}/backend/.env.staging
ExecStart=${APP_DIR}/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8889 --workers 1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "==> Demo systemd service (port 8890)"
sudo tee /etc/systemd/system/jyotish-backend-demo.service > /dev/null <<EOF
[Unit]
Description=Jyotish FastAPI Backend (Demo)
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${APP_DIR}/backend/.env.demo
ExecStart=${APP_DIR}/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8890 --workers 1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now jyotish-backend-staging jyotish-backend-demo

echo "==> Web roots"
sudo mkdir -p /var/www/jyotish-staging /var/www/jyotish-demo

echo "==> Nginx htpasswd for staging (user: preview)"
sudo apt-get install -y apache2-utils -q
echo "${STAGING_BASIC_PASS:-preview123}" | sudo htpasswd -ci /etc/nginx/.htpasswd-staging preview

echo "==> SSL certs for staging + demo domains"
DOMAIN="${DOMAIN:-yourdomain.com}"
sudo certbot certonly --nginx \
  -d "staging.${DOMAIN}" -d "api-staging.${DOMAIN}" \
  -d "demo.${DOMAIN}" -d "api-demo.${DOMAIN}" \
  --non-interactive --agree-tos -m "admin@${DOMAIN}"

echo "==> Install nginx config"
sudo cp "$APP_DIR/deploy/nginx-all-envs.conf" /etc/nginx/sites-available/jyotish-all
sudo sed -i "s/yourdomain.com/${DOMAIN}/g" /etc/nginx/sites-available/jyotish-all
sudo ln -sf /etc/nginx/sites-available/jyotish-all /etc/nginx/sites-enabled/jyotish-all
sudo nginx -t && sudo systemctl reload nginx

echo "================================================"
echo " Staging: https://staging.${DOMAIN}  (basic auth: preview / ${STAGING_BASIC_PASS:-preview123})"
echo " Demo:    https://demo.${DOMAIN}"
echo "================================================"
