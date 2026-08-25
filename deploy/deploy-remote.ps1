# Deploy the latest main to the server, from this machine, by yourself.
#
# Prerequisites (one time):
#   - Your key is in the server's authorized_keys (add it via the play2go
#     console — see deploy/README.md).
#   - Happ/Xray running, so socks-forward.ps1 can reach the server.
#
# What it does: makes sure the SOCKS forward is up, then SSHes in over it and
# runs deploy.sh main (pull -> build -> migrate -> seed -> restart -> health).
#
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy\deploy-remote.ps1

param(
  [string]$Key = "$env:USERPROFILE\.ssh\id_ed25519",
  [string]$User = "root",
  [int]$LocalPort = 2222,
  [string]$Ref = "main",
  [string]$AppDir = "/var/www/nesilcoffee/app"
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Ensure the tunnel is listening.
$up = Test-NetConnection -ComputerName 127.0.0.1 -Port $LocalPort `
        -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $up) {
  Write-Host "Starting SOCKS forward..."
  Start-Process powershell -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $here 'socks-forward.ps1') -WindowStyle Minimized
  Start-Sleep -Seconds 4
  $up = Test-NetConnection -ComputerName 127.0.0.1 -Port $LocalPort `
          -WarningAction SilentlyContinue -InformationLevel Quiet
  if (-not $up) {
    Write-Error "Tunnel did not come up on 127.0.0.1:$LocalPort. Is Happ running?"
    exit 1
  }
}

# 2. Run the release on the server over the tunnel. StrictHostKeyChecking=accept-new
#    trusts the key on first connect, then pins it for later runs.
Write-Host "Deploying $Ref to the server..."
ssh -i $Key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new `
    -o ConnectTimeout=25 -p $LocalPort "$User@127.0.0.1" `
    "bash $AppDir/deploy/deploy.sh $Ref"

if ($LASTEXITCODE -eq 0) {
  Write-Host "`nDeployed. The site is now running the latest $Ref." -ForegroundColor Green
} else {
  Write-Error "Deploy failed (exit $LASTEXITCODE). Read the output above for the failing step."
  exit $LASTEXITCODE
}
