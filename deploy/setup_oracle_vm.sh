#!/usr/bin/env bash
# =================================================================
# Jyotish SaaS — Oracle Always Free VM (Ubuntu 22.04 ARM)
# Run once as ubuntu user after provisioning the VM
# =================================================================
set -euo pipefail

APP_DIR="/home/ubuntu/jyotish"
DOMAIN="${DOMAIN:-yourdomain.com}"          # override via env
API_SUBDOMAIN="api.${DOMAIN}"
APP_SUBDOMAIN="${DOMAIN}"

echo "==> [1/8] System update"
sudo apt-get update && sudo apt-get upgrade -y

echo "==> [2/8] Install packages"
sudo apt-get install -y \
  python3.11 python3.11-venv python3.11-dev python3-pip \
  postgresql-16 postgresql-client-16 \
  nginx certbot python3-certbot-nginx \
  git curl build-essential libpq-dev

echo "==> [3/8] PostgreSQL setup"
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='jyotish') THEN
      CREATE USER jyotish WITH PASSWORD '${DB_PASSWORD:-changeme}';
    END IF;
  END
  \$\$;
  CREATE DATABASE jyotish OWNER jyotish;
"
sudo -u postgres psql -d jyotish -c "GRANT ALL ON SCHEMA public TO jyotish;"

echo "==> [4/8] Clone / pull repo"
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull
else
  git clone "${GIT_REPO:-https://github.com/YOURUSER/YOURREPO.git}" "$APP_DIR"
fi

echo "==> [5/8] Backend venv + deps"
cd "$APP_DIR/backend"
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "==> [6/8] DB schema init"
PGPASSWORD="${DB_PASSWORD:-changeme}" psql -U jyotish -d jyotish -h 127.0.0.1 \
  -f "$APP_DIR/database/init.sql"

echo "==> [7/8] Systemd service"
sudo tee /etc/systemd/system/jyotish-backend.service > /dev/null <<EOF
[Unit]
Description=Jyotish FastAPI Backend
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${APP_DIR}/backend/.env
ExecStart=${APP_DIR}/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8888 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now jyotish-backend

echo "==> [8/8] Nginx + HTTPS"
sudo tee /etc/nginx/sites-available/jyotish > /dev/null <<'EOF'
server {
    listen 80;
    server_name REPLACE_DOMAIN REPLACE_API_DOMAIN;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name REPLACE_DOMAIN;

    root /var/www/jyotish;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    ssl_certificate     /etc/letsencrypt/live/REPLACE_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/REPLACE_DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}

server {
    listen 443 ssl http2;
    server_name REPLACE_API_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        client_max_body_size 10m;
    }

    ssl_certificate     /etc/letsencrypt/live/REPLACE_API_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/REPLACE_API_DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
EOF

# Replace placeholders
sudo sed -i "s/REPLACE_DOMAIN/${APP_SUBDOMAIN}/g; s/REPLACE_API_DOMAIN/${API_SUBDOMAIN}/g" \
  /etc/nginx/sites-available/jyotish

sudo mkdir -p /var/www/jyotish
sudo ln -sf /etc/nginx/sites-available/jyotish /etc/nginx/sites-enabled/jyotish
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# SSL certs
sudo certbot --nginx -d "$APP_SUBDOMAIN" -d "$API_SUBDOMAIN" \
  --non-interactive --agree-tos -m "admin@${DOMAIN}"

sudo systemctl reload nginx

echo ""
echo "================================================="
echo " DONE. Jyotish running at:"
echo "   Frontend: https://${APP_SUBDOMAIN}"
echo "   Backend:  https://${API_SUBDOMAIN}"
echo ""
echo " IMPORTANT: create ${APP_DIR}/backend/.env"
echo " See backend/.env.example for required vars"
echo "================================================="
