$ErrorActionPreference = 'Continue'
$Port = 8084
$Url = "http://localhost:$Port"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

$env:NODE_OPTIONS = '--use-system-ca'
$ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
  Select-Object -First 1 -ExpandProperty IPAddress
if ($ip) {
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
}

function Test-AudiationReady {
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port" -UseBasicParsing -TimeoutSec 3
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

Set-Location $Root

if (Test-AudiationReady) {
  Write-Host "Audiation draait al. Browser openen..."
  Start-Process $Url
  Write-Host "Klaar. Dit venster mag dicht als de app al in een ander venster draait."
  exit 0
}

$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -eq $Port }
foreach ($row in $listeners) {
  Write-Host "Poort $Port was bezet door proces $($row.OwningProcess). Stoppen..."
  Stop-Process -Id $row.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

$npx = Join-Path ${env:ProgramFiles} 'nodejs\npx.cmd'
if (-not (Test-Path $npx)) {
  $npx = 'G:\Program Files\nodejs\npx.cmd'
}
if (-not (Test-Path $npx)) {
  $npx = 'npx'
}

$openBrowser = @"
for (`$i = 0; `$i -lt 90; `$i++) {
  Start-Sleep -Seconds 2
  try {
    Invoke-WebRequest -Uri 'http://127.0.0.1:$Port' -UseBasicParsing -TimeoutSec 2 | Out-Null
    Start-Process '$Url'
    exit 0
  } catch {}
}
"@
Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-Command', $openBrowser
) | Out-Null

Write-Host "Metro starten. De browser opent vanzelf als localhost klaar is."
Write-Host "Adres: $Url"
if ($ip) {
  Write-Host "Telefoon (zelfde wifi): exp://${ip}:${Port}"
}
Write-Host ""

& $npx expo start --web --lan --port $Port
exit $LASTEXITCODE
