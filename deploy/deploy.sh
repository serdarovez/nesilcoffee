#!/usr/bin/env bash
#
# Build and release. Run after every push; safe to re-run at any time.
#
# Usage, on the server:
#   /var/www/nesilcoffee/app/deploy/deploy.sh [git-ref]
#
set -euo pipefail

APP_DIR=/var/www/nesilcoffee
REPO_DIR="$APP_DIR/app"
ENV_FILE="$APP_DIR/.env"
REF="${1:-}"

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

cd "$REPO_DIR"

[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE — run setup-server.sh first"; exit 1; }
set -a; . "$ENV_FILE"; set +a

# --------------------------------------------------------------------------
log "Backup (pre-deploy DB snapshot)"
# --------------------------------------------------------------------------
# Dump the live database BEFORE anything changes, so a bad migration or release
# can be rolled back. Kept in $APP_DIR/backups (outside the repo, so git never
# touches them), newest 10 retained. Best-effort: a fresh server with no data
# yet must not fail the release here. The `?schema=…` Prisma param is stripped
# because pg_dump rejects it.
BACKUP_DIR="$APP_DIR/backups"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%F-%H%M%S)"
if pg_dump "${DATABASE_URL%%[?]*}" 2>/dev/null | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"; then
  ls -1t "$BACKUP_DIR"/db-*.sql.gz | tail -n +11 | xargs -r rm -f
  echo "  saved db-$STAMP.sql.gz ($(du -h "$BACKUP_DIR/db-$STAMP.sql.gz" | cut -f1)) — keeping newest 10"
else
  rm -f "$BACKUP_DIR/db-$STAMP.sql.gz"
  echo "  skipped (database not reachable yet — normal on first setup)"
fi

# --------------------------------------------------------------------------
log "Fetching source"
# --------------------------------------------------------------------------
git fetch --all --prune
if [ -n "$REF" ]; then
  git checkout "$REF"
  git pull --ff-only origin "$REF" || true
else
  git pull --ff-only
fi
git --no-pager log -1 --oneline

# --------------------------------------------------------------------------
log "Dependencies"
# --------------------------------------------------------------------------
# Dev dependencies are required: the build needs typescript, tailwind and the
# next-intl plugin, prisma.config.ts needs dotenv, and `db:seed` runs through
# tsx. `.env` (sourced above) sets NODE_ENV=production, which makes npm skip
# devDependencies — so force them in explicitly with --include=dev.
npm ci --include=dev

# --------------------------------------------------------------------------
log "Database"
# --------------------------------------------------------------------------
# No postinstall hook in package.json, so the client is generated explicitly.
npx prisma generate
npx prisma migrate deploy

# Seeds ONLY an empty database (--if-empty). This creates content on a fresh
# server — including the fixed pair of About-page experts the admin cannot add
# — but never runs again once products exist, so a redeploy can't re-create
# demo rows an editor deleted. To reseed deliberately, run `npm run db:seed`
# (no flag) by hand.
npm run db:seed:if-empty

# Country database for first-visit language detection. Best-effort: the site is
# fully functional without it (it falls back to Accept-Language), so a download
# failure must not fail the release. Refreshes the file monthly on redeploys.
npm run geoip:fetch || echo "  geoip:fetch failed — detection falls back to Accept-Language"

# --------------------------------------------------------------------------
log "Build"
# --------------------------------------------------------------------------
# NEXT_PUBLIC_SITE_URL is inlined at build time, which is why .env is sourced
# above rather than left to the systemd unit alone.
#
# NODE_OPTIONS caps V8's heap so the build can't balloon and freeze a small
# (2 GB) box — with a swap file as backstop, it completes instead of OOM-ing.
# Raise this if the server has more RAM. `${NODE_OPTIONS:-}` lets an outer
# override win.
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}" npm run build

# --------------------------------------------------------------------------
log "Restart"
# --------------------------------------------------------------------------
sudo systemctl restart nesilcoffee
sleep 3
systemctl is-active --quiet nesilcoffee || {
  echo "service failed to start:"
  journalctl -u nesilcoffee -n 40 --no-pager
  exit 1
}

# --------------------------------------------------------------------------
log "Health check"
# --------------------------------------------------------------------------
# / is a 307 to the detected locale, not a 200 — that redirect is the signal
# the app and its locale negotiation are both alive.
code="$(curl -s -o /dev/null -w '%{http_code}' -I http://127.0.0.1:3000/)"
case "$code" in
  200|307|308) echo "app responding ($code)" ;;
  *) echo "unexpected status $code"; journalctl -u nesilcoffee -n 40 --no-pager; exit 1 ;;
esac

log "Deployed: $(git --no-pager log -1 --oneline)"
