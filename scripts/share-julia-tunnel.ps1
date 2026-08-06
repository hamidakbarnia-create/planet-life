# Share Planet Life dev with Julia (or any remote reviewer) via Cloudflare quick tunnels.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/share-julia-tunnel.ps1
#
# Prerequisites:
#   - Backend running on http://localhost:8000
#   - Frontend running on http://localhost:3000
#   - cloudflared installed (winget install Cloudflare.cloudflared)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$WebDir = Join-Path $Root "apps\web"
$Cf = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $Cf)) { $Cf = "cloudflared" }

function Test-PortListening([int]$Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Start-Tunnel([string]$Name, [string]$LocalUrl) {
  $log = Join-Path $PSScriptRoot "tunnel-$Name.log"
  if (Test-Path $log) { Remove-Item $log -Force }
  Start-Process -FilePath $Cf -ArgumentList @(
    "tunnel", "--url", $LocalUrl, "--logfile", $log, "--loglevel", "info"
  ) -WindowStyle Minimized | Out-Null

  $url = $null
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $log) {
      $match = Select-String -Path $log -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -First 1
      if ($match) {
        $url = $match.Matches[0].Value
        break
      }
    }
  }
  if (-not $url) { throw "Timed out waiting for $Name tunnel URL. See $log" }
  return $url
}

Write-Host ""
Write-Host "Planet Life — Julia share tunnel" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

if (-not (Test-PortListening 8000)) {
  Write-Host "Backend is not running on port 8000." -ForegroundColor Red
  Write-Host "Start it first:" -ForegroundColor Yellow
  Write-Host "  cd apps\api\src"
  Write-Host "  py -3.11 -m uvicorn main:app --reload --port 8000"
  exit 1
}
if (-not (Test-PortListening 3000)) {
  Write-Host "Frontend is not running on port 3000." -ForegroundColor Red
  Write-Host "Start it first:" -ForegroundColor Yellow
  Write-Host "  cd apps\web"
  Write-Host "  npm run dev"
  exit 1
}

Write-Host "Starting backend tunnel (port 8000)..." -ForegroundColor Gray
$apiUrl = Start-Tunnel -Name "api" -LocalUrl "http://localhost:8000"
Set-Content -Path (Join-Path $WebDir ".env.local") -Value "NEXT_PUBLIC_API_BASE=$apiUrl" -Encoding utf8
Write-Host "  API tunnel: $apiUrl" -ForegroundColor Green
Write-Host "  Wrote apps/web/.env.local" -ForegroundColor Green

Write-Host ""
Write-Host "IMPORTANT: Restart the frontend dev server so it picks up .env.local" -ForegroundColor Yellow
Write-Host "  Ctrl+C in the frontend terminal, then: npm run dev" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter after restarting frontend (or skip if already restarted)"

Write-Host "Starting frontend tunnel (port 3000)..." -ForegroundColor Gray
$webUrl = Start-Tunnel -Name "web" -LocalUrl "http://localhost:3000"
Write-Host "  Web tunnel: $webUrl" -ForegroundColor Green

Write-Host ""
Write-Host "Share this link with Julia:" -ForegroundColor Cyan
Write-Host "  $webUrl" -ForegroundColor White
Write-Host ""
Write-Host "Keep these running until review is done:" -ForegroundColor Yellow
Write-Host "  1. Backend server (port 8000)"
Write-Host "  2. Frontend server (port 3000) — restarted after .env.local update"
Write-Host "  3. Both cloudflared tunnel windows"
Write-Host ""
Write-Host "Optional login: any email + any 6-digit code on /login" -ForegroundColor Gray
