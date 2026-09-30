param(
  [int]$Port = 5433,
  [string]$PostgresBin = 'C:\Program Files\PostgreSQL\18\bin'
)

$ErrorActionPreference = 'Stop'
$backendDir = Split-Path -Parent $PSScriptRoot
$localDir = Join-Path $backendDir '.local'
$dataDir = Join-Path $localDir 'postgres-data'
$passwordFile = Join-Path $localDir 'init-password.txt'
$environmentFile = Join-Path $backendDir '.env.local'

foreach ($executable in 'initdb.exe', 'pg_ctl.exe', 'createdb.exe', 'psql.exe') {
  if (-not (Test-Path (Join-Path $PostgresBin $executable))) {
    throw "PostgreSQL non trovato in $PostgresBin"
  }
}

New-Item -ItemType Directory -Force -Path $localDir | Out-Null
if (-not (Test-Path $passwordFile)) {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  [IO.File]::WriteAllText($passwordFile, [Convert]::ToBase64String($bytes))
}

$password = [IO.File]::ReadAllText($passwordFile)
if (-not (Test-Path (Join-Path $dataDir 'PG_VERSION'))) {
  & (Join-Path $PostgresBin 'initdb.exe') -D $dataDir -U randyflow --pwfile=$passwordFile --auth-host=scram-sha-256 --auth-local=scram-sha-256 --encoding=UTF8 --locale=C
  if ($LASTEXITCODE -ne 0) { throw 'Inizializzazione PostgreSQL non riuscita' }
}

& (Join-Path $PostgresBin 'pg_ctl.exe') status -D $dataDir *> $null
if ($LASTEXITCODE -ne 0) {
  & (Join-Path $PostgresBin 'pg_ctl.exe') start -D $dataDir -l (Join-Path $localDir 'postgres.log') -o "-p $Port"
  if ($LASTEXITCODE -ne 0) { throw 'Avvio PostgreSQL non riuscito' }
}

$env:PGPASSWORD = $password
$exists = & (Join-Path $PostgresBin 'psql.exe') -h localhost -p $Port -U randyflow -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='randyflow'"
if ($LASTEXITCODE -ne 0) { throw 'Verifica database non riuscita' }
if ($exists -ne '1') {
  & (Join-Path $PostgresBin 'createdb.exe') -h localhost -p $Port -U randyflow randyflow
  if ($LASTEXITCODE -ne 0) { throw 'Creazione database non riuscita' }
}

@(
  "DATABASE_URL=jdbc:postgresql://localhost:$Port/randyflow"
  'DATABASE_USERNAME=randyflow'
  "DATABASE_PASSWORD=$password"
  'STORAGE_PATH=./storage'
  'CORS_ORIGIN=http://localhost:3000'
  'SERVER_PORT=8081'
) | Set-Content -LiteralPath $environmentFile

Write-Host "PostgreSQL locale pronto sulla porta $Port. Credenziali salvate in backend/.env.local (ignorato da Git)."
