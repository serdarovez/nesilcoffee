# Pull a fresh database + uploads backup from the server down to this laptop.
#
# Uses the `nesil` SSH alias (which tunnels through Happ automatically), so
# Happ must be running. Creates a fresh dump on the server, then downloads
# both files into deploy/../backups/<timestamp>/ on this machine.
#
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy\backup-pull.ps1
#
# You will be prompted for the root password twice (once for the dump, once
# for the download) unless you have key auth set up.

$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$dest = Join-Path (Join-Path $PSScriptRoot "..\backups") $stamp
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Write-Host "1/2  Creating backup on the server (enter the root password if prompted)…"
# Single-quoted here-string: PowerShell must NOT expand $DATABASE_URL etc. —
# they run in the remote shell. `${DATABASE_URL%%[?]*}` strips the ?schema=…
# Prisma param that pg_dump rejects.
$remote = @'
set -a; . /var/www/nesilcoffee/.env; set +a
d=/root/pull-backup; rm -rf "$d"; mkdir -p "$d"
pg_dump "${DATABASE_URL%%[?]*}" | gzip > "$d/db.sql.gz"
tar czf "$d/uploads.tar.gz" -C /var/www/nesilcoffee uploads
ls -lh "$d"
'@
ssh nesil $remote

Write-Host "2/2  Downloading to $dest …"
scp "nesil:/root/pull-backup/db.sql.gz" "nesil:/root/pull-backup/uploads.tar.gz" $dest

$db = Join-Path $dest "db.sql.gz"
if (Test-Path $db -PathType Leaf) {
  Write-Host "`nBackup complete:" -ForegroundColor Green
  Get-ChildItem $dest | ForEach-Object { "  {0,12:N0} bytes  {1}" -f $_.Length, $_.Name }
  Write-Host "`nSaved in: $dest"
} else {
  Write-Error "Backup failed — db.sql.gz was not downloaded. Is Happ running and the server up?"
}
