# Script para reiniciar o backend do PhotoFinder

Write-Host "`n=== Parando Backend Antigo ===" -ForegroundColor Yellow

# Encontrar e parar processos Node.js na porta 4000
$backend = netstat -ano | findstr ":4000" | findstr "LISTENING"
if ($backend) {
    $pid = ($backend -split '\s+')[-1]
    Write-Host "Parando processo PID: $pid" -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "`n=== Iniciando Backend ===" -ForegroundColor Green
Set-Location "C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive\backend"
node index.js

