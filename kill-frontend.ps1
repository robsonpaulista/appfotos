# Script para finalizar processos do frontend na porta 3000

Write-Host "`n=== Finalizando Frontend (porta 3000) ===" -ForegroundColor Yellow

$processes = netstat -ano | findstr ":3000" | findstr "LISTENING"

if ($processes) {
    $pids = $processes | ForEach-Object { 
        ($_ -split '\s+')[-1] 
    } | Select-Object -Unique
    
    foreach ($pid in $pids) {
        if ($pid -match '^\d+$') {
            Write-Host "Matando processo PID: $pid" -ForegroundColor Red
            taskkill /PID $pid /F
        }
    }
    
    Write-Host "`n✅ Frontend finalizado!" -ForegroundColor Green
} else {
    Write-Host "`n✅ Nenhum processo encontrado na porta 3000" -ForegroundColor Green
}

Write-Host ""

