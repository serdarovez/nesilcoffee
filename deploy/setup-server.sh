#!/usr/bin/env bash
#
# One-time provisioning for a fresh Ubuntu 22.04/24.04 host.
#
# Installs Node 20, PostgreSQL, nginx and certbot; creates the service user,
# the database and the upload directory; installs the systemd unit and the
# nginx site. Safe to re-run — every step checks before it acts.
#
# Usage, as root on the server:
#   DOMAIN=nesilcoffee.com [email protected] ./setup-server.sh
#
set -euo pipefail

DOMAIN="${DOMAIN:?set DOMAIN, e.g. DOMAIN=nesilcoffee.com}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"

APP_USER=nesil
APP_DIR=/var/www/nesilcoffee
REPO_DIR="$APP_DIR/app"
UPLOAD_DIR="$APP_DIR/uploads"
DB_NAME=nesilcoffee
DB_USER=nesil

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

# --------------------------------------------------------------------------
log "System packages"
# --------------------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg git nginx postgresql \
  postgresql-contrib ufw

# Node 20 from NodeSource. The app needs 20.9+; Ubuntu ships older.
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  log "Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
node -v

# --------------------------------------------------------------------------
log "Service user and directories"
# --------------------------------------------------------------------------
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home \
  --home-dir "/home/$APP_USER" --shell /bin/bash "$APP_USER"

mkdir -p "$REPO_DIR" "$UPLOAD_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
# nginx serves /uploads straight off disk, so its worker must be able to
# traverse into the directory.
chmod 755 "$APP_DIR" "$UPLOAD_DIR"

# --------------------------------------------------------------------------
log "PostgreSQL"
# --------------------------------------------------------------------------
systemctl enable --now postgresql

DB_PASS_FILE="$APP_DIR/.dbpass"
if [ ! -f "$DB_PASS_FILE" ]; then
  # Generated once and kept, so re-running never invalidates the live DATABASE_URL.
  openssl rand -base64 32 | tr -d '/+=' | head -c 32 > "$DB_PASS_FILE"
  chmod 600 "$DB_PASS_FILE"
fi
DB_PASS="$(cat "$DB_PASS_FILE")"

sudo -u postgres psql -tAc \
  "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -qc \
    "CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS'"

# Keep the password in step with the file on a re-run.
sudo -u postgres psql -qc "ALTER ROLE $DB_USER PASSWORD '$DB_PASS'"

sudo -u postgres psql -tAc \
  "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"

# --------------------------------------------------------------------------
log "Application environment"
# --------------------------------------------------------------------------
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
UPLOAD_DIR=$UPLOAD_DIR
NODE_ENV=production
PORT=3000

# Country DB for first-visit language detection. Defaults to the free DB-IP
# Lite file that `npm run geoip:fetch` downloads (no account); set a MaxMind
# key instead to use GeoLite2. See .env.example.
GEOIP_DB_PATH=$APP_DIR/app/data/dbip-country-lite.mmdb
# MAXMIND_ACCOUNT_ID=
# MAXMIND_LICENSE_KEY=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
CONTACT_TO_EMAIL=info@$DOMAIN
CONTACT_FROM_EMAIL="NesilCoffee <no-reply@$DOMAIN>"

WHATSAPP_ENABLED=false
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_TO=
WHATSAPP_TEMPLATE=
EOF
  echo "wrote $ENV_FILE"
else
  echo "$ENV_FILE exists — left as is"
fi
chown "$APP_USER:$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"
mkdir -p "$APP_DIR/data" && chown "$APP_USER:$APP_USER" "$APP_DIR/data"

# --------------------------------------------------------------------------
log "systemd unit"
# --------------------------------------------------------------------------
install -m 644 "$(dirname "$0")/nesilcoffee.service" \
  /etc/systemd/system/nesilcoffee.service
systemctl daemon-reload
systemctl enable nesilcoffee

# --------------------------------------------------------------------------
log "nginx"
# --------------------------------------------------------------------------
sed "s/__DOMAIN__/$DOMAIN/g; s#__UPLOAD_DIR__#$UPLOAD_DIR#g" \
  "$(dirname "$0")/nginx.conf" > /etc/nginx/sites-available/nesilcoffee
ln -sf /etc/nginx/sites-available/nesilcoffee \
  /etc/nginx/sites-enabled/nesilcoffee
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# --------------------------------------------------------------------------
log "Firewall"
# --------------------------------------------------------------------------
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# --------------------------------------------------------------------------
log "TLS"
# --------------------------------------------------------------------------
# Certbot rewrites the nginx site in place to add the 443 server block.
# Skipped when DNS does not yet point here — rerun it once it does.
if [ -n "$LETSENCRYPT_EMAIL" ]; then
  apt-get install -y -qq certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
    --non-interactive --agree-tos -m "$LETSENCRYPT_EMAIL" --redirect || {
      echo "certbot failed — check that $DOMAIN resolves to this server, then:"
      echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    }
else
  echo "LETSENCRYPT_EMAIL unset — skipping TLS. Run certbot once DNS is live."
fi

log "Provisioning done"
cat <<EOF

  Next: clone the repository and release.

    git clone <your-remote> $REPO_DIR
    chown -R $APP_USER:$APP_USER $REPO_DIR
    $REPO_DIR/deploy/deploy.sh

  Database URL is already in $ENV_FILE (password in $DB_PASS_FILE).
EOF
