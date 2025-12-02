# Script para reiniciar Backend e Frontend do PhotoFinder

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   PhotoFinder - Reiniciar Aplicação" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Parar Backend (porta 4000)
Write-Host "1. Parando Backend (porta 4000)..." -ForegroundColor Yellow
$backend = netstat -ano | findstr ":4000" | findstr "LISTENING"
if ($backend) {
    $pid = ($backend -split '\s+')[-1]
    if ($pid -match '^\d+$') {
        taskkill /PID $pid /F | Out-Null
        Write-Host "   ✅ Backend parado (PID: $pid)" -ForegroundColor Green
    }
} else {
    Write-Host "   ℹ️  Backend já estava parado" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# 2. Parar Frontend (porta 3000)
Write-Host "`n2. Parando Frontend (porta 3000)..." -ForegroundColor Yellow
$frontend = netstat -ano | findstr ":3000" | findstr "LISTENING"
if ($frontend) {
    $pid = ($frontend -split '\s+')[-1]
    if ($pid -match '^\d+$') {
        taskkill /PID $pid /F | Out-Null
        Write-Host "   ✅ Frontend parado (PID: $pid)" -ForegroundColor Green
    }
} else {
    Write-Host "   ℹ️  Frontend já estava parado" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# 3. Iniciar Backend
Write-Host "`n3. Iniciando Backend..." -ForegroundColor Yellow
Set-Location "C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node index.js"
Write-Host "   ✅ Backend iniciando em nova janela..." -ForegroundColor Green

Start-Sleep -Seconds 3

# 4. Iniciar Frontend
Write-Host "`n4. Iniciando Frontend..." -ForegroundColor Yellow
Set-Location "C:\Users\robso\OneDrive\Documentos\Coorporativo\JArchive\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Write-Host "   ✅ Frontend iniciando em nova janela..." -ForegroundColor Green

Start-Sleep -Seconds 5

# 5. Verificar portas
Write-Host "`n5. Verificando se os servidores subiram..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$backend4000 = netstat -ano | findstr ":4000" | findstr "LISTENING"
$frontend3000 = netstat -ano | findstr ":3000" | findstr "LISTENING"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Status dos Servidores:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($backend4000) {
    Write-Host "   Backend (4000):  ✅ ONLINE" -ForegroundColor Green
} else {
    Write-Host "   Backend (4000):  ❌ OFFLINE" -ForegroundColor Red
}

if ($frontend3000) {
    Write-Host "   Frontend (3000): ✅ ONLINE" -ForegroundColor Green
} else {
    Write-Host "   Frontend (3000): ❌ OFFLINE (aguardando compilação...)" -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

# 6. Abrir navegador
if ($frontend3000 -and $backend4000) {
    Write-Host "🚀 Abrindo navegador..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
    Write-Host "`n✅ Aplicação pronta! Verifique o navegador.`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  Aguarde alguns segundos e verifique as janelas abertas." -ForegroundColor Yellow
    Write-Host "   Acesse manualmente: http://localhost:3000`n" -ForegroundColor Yellow
}

