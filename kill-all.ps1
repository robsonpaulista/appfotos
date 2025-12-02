# Script para matar TODOS os processos do PhotoFinder

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   PhotoFinder - Matar Processos" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Matar Backend (porta 4000)
Write-Host "Procurando Backend na porta 4000..." -ForegroundColor Yellow
$backend = netstat -ano | findstr ":4000" | findstr "LISTENING"
if ($backend) {
    $pid = ($backend -split '\s+')[-1]
    if ($pid -match '^\d+$') {
        Write-Host "  Matando processo PID: $pid" -ForegroundColor Red
        taskkill /PID $pid /F
        Write-Host "  ✅ Backend finalizado!" -ForegroundColor Green
    }
} else {
    Write-Host "  ℹ️  Nenhum processo encontrado na porta 4000" -ForegroundColor Gray
}

Start-Sleep -Seconds 1

# Matar Frontend (porta 3000)
Write-Host "`nProcurando Frontend na porta 3000..." -ForegroundColor Yellow
$frontend = netstat -ano | findstr ":3000" | findstr "LISTENING"
if ($frontend) {
    $pid = ($frontend -split '\s+')[-1]
    if ($pid -match '^\d+$') {
        Write-Host "  Matando processo PID: $pid" -ForegroundColor Red
        taskkill /PID $pid /F
        Write-Host "  ✅ Frontend finalizado!" -ForegroundColor Green
    }
} else {
    Write-Host "  ℹ️  Nenhum processo encontrado na porta 3000" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ✅ Todos os processos finalizados!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Agora você pode:" -ForegroundColor White
Write-Host "  1. Executar os SQLs no Supabase" -ForegroundColor White
Write-Host "  2. Executar: .\restart-all.ps1" -ForegroundColor Yellow
Write-Host ""

