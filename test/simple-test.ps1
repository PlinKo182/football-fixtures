# Script simples de teste para API de migracao
$apiBase = "http://localhost:3003"

Write-Host "TESTANDO SISTEMA DE MIGRACAO" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

try {
    Write-Host "1. LISTANDO CANDIDATOS..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri "$apiBase/api/migrate-game" -Method GET -ContentType "application/json"
    
    Write-Host "Resposta recebida: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
    
    if ($response.candidates -and $response.candidates.Count -gt 0) {
        Write-Host "Encontrados candidatos: $($response.count)" -ForegroundColor Green
        
        $firstGame = $response.candidates[0]
        Write-Host "Primeiro jogo: $($firstGame.homeTeam) vs $($firstGame.awayTeam)" -ForegroundColor White
        Write-Host "ID: $($firstGame._id)" -ForegroundColor Gray
        
        # Testar migracao
        Write-Host "`n2. TESTANDO MIGRACAO..." -ForegroundColor Cyan
        
        $testBody = @{
            gameId = $firstGame._id
            testMode = $true
        } | ConvertTo-Json
        
        $testResponse = Invoke-RestMethod -Uri "$apiBase/api/migrate-game" -Method POST -Body $testBody -ContentType "application/json"
        
        Write-Host "TESTE CONCLUIDO COM SUCESSO!" -ForegroundColor Green
        Write-Host "Season calculada: $($testResponse.wouldCreate.season)" -ForegroundColor White
        Write-Host "TeamOdds: $($testResponse.teamOddsPreview | ConvertTo-Json)" -ForegroundColor White
        
    } else {
        Write-Host "Nenhum candidato encontrado" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}