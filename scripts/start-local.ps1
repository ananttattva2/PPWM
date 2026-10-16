$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$nextEntry = Join-Path $projectPath 'node_modules/next/dist/bin/next'
function Start-PortAlias {
    $aliasEntry = Join-Path $projectPath 'scripts/port-alias.mjs'
    $aliasListener = Get-NetTCPConnection -LocalPort 7000 -State Listen -ErrorAction SilentlyContinue
    if ($aliasListener) {
        $aliasProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($aliasListener[0].OwningProcess)"
        if (-not ($aliasProcess.CommandLine.Contains($aliasEntry) -or $aliasProcess.CommandLine.Contains($projectPath))) {
            throw 'Port 7000 is in use by another application.'
        }
        return
    }
    $aliasLogs = Join-Path $projectPath '.local'
    New-Item -ItemType Directory -Path $aliasLogs -Force | Out-Null
    Start-Process -FilePath (Get-Command node).Source -ArgumentList @(('"' + $aliasEntry + '"')) -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $aliasLogs 'port-7000.log') -RedirectStandardError (Join-Path $aliasLogs 'port-7000-error.log') | Out-Null
}
if (-not (Test-Path -LiteralPath $nextEntry)) {
    throw 'Dependencies are missing. Run npm ci in the project folder first.'
}
$listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    $existing = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener[0].OwningProcess)"
    if (-not $existing.CommandLine.Contains($projectPath)) {
        throw 'Port 3000 is being used by another application. Stop that application before starting PPWM.'
    }
    Start-PortAlias
    Write-Host 'PPWM is running at http://localhost:3000 and http://127.0.0.1:7000'
    exit 0
}
$logPath = Join-Path $projectPath '.local'
New-Item -ItemType Directory -Path $logPath -Force | Out-Null
$nodePath = (Get-Command node).Source
$server = Start-Process -FilePath $nodePath -ArgumentList @(('"' + $nextEntry + '"'), 'dev', '--port', '3000') -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logPath 'server.log') -RedirectStandardError (Join-Path $logPath 'server-error.log') -PassThru
for ($attempt = 0; $attempt -lt 45; $attempt++) {
    if ($server.HasExited) { throw 'Server exited. Check .local/server-error.log for details.' }
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Start-PortAlias
            Write-Host 'PPWM is ready at http://localhost:3000 and http://127.0.0.1:7000'
            Write-Host 'The server keeps running after this command finishes. Logs: .local/server.log'
            exit 0
        }
    } catch { }
    Start-Sleep -Seconds 1
}
throw 'Server did not become ready. Check .local/server.log and .local/server-error.log.'
