$ErrorActionPreference = 'Stop'
$backendDir = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $backendDir '.env.local'

if (-not (Test-Path $environmentFile)) {
  throw 'Esegui prima backend/scripts/setup-local-postgres.ps1'
}

Get-Content $environmentFile | ForEach-Object {
  if ($_ -match '^([^#][^=]*)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
  }
}

Push-Location $backendDir
try {
  & mvn.cmd spring-boot:run
} finally {
  Pop-Location
}
