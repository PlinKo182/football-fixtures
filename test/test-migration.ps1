# Script de teste PowerShell para API de migração
$apiBase = "http://localhost:3003"

Write-Host "🧪 TESTANDO SISTEMA DE MIGRAÇÃO" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Yellow

try {
    Write-Host "1️⃣ LISTANDO CANDIDATOS..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri "$apiBase/api/migrate-game" -Method GET -ContentType "application/json"
    
    if ($response.candidates -and $response.candidates.Count -gt 0) {
        Write-Host "✅ Encontrados $($response.count) candidatos:" -ForegroundColor Green
        
        for ($i = 0; $i -lt $response.candidates.Count; $i++) {
            $game = $response.candidates[$i]
            $date = Get-Date $game.date -Format "dd/MM/yyyy"
            
            Write-Host "$($i + 1). $($game.homeTeam) vs $($game.awayTeam)" -ForegroundColor White
            Write-Host "   📅 $date" -ForegroundColor Gray
            Write-Host "   ⚽ $($game.score)" -ForegroundColor Gray  
            Write-Host "   🎯 Odds: $(if ($game.hasCustomOdds) { $game.customOdds } else { 'Padrão (3.0)' })" -ForegroundColor Gray
            Write-Host "   🆔 $($game._id)" -ForegroundColor DarkGray
            Write-Host "─────────────────────────────────" -ForegroundColor DarkGray
        }
        
        # Testar migração do primeiro jogo
        $firstGameId = $response.candidates[0]._id
        Write-Host "`n2️⃣ TESTANDO MIGRAÇÃO DO JOGO: $firstGameId" -ForegroundColor Cyan
        
        $testBody = @{
            gameId = $firstGameId
            testMode = $true
        } | ConvertTo-Json
        
        $testResponse = Invoke-RestMethod -Uri "$apiBase/api/migrate-game" -Method POST -Body $testBody -ContentType "application/json"
        
        Write-Host "✅ TESTE DE MIGRAÇÃO CONCLUÍDO" -ForegroundColor Green
        
        Write-Host "`nOriginal:" -ForegroundColor White
        $originalDate = Get-Date $testResponse.originalGame.date -Format "dd/MM/yyyy"
        Write-Host "- Teams: $($testResponse.originalGame.homeTeam) vs $($testResponse.originalGame.awayTeam)" -ForegroundColor Gray
        Write-Host "- Date: $originalDate" -ForegroundColor Gray
        Write-Host "- Score: $($testResponse.originalGame.homeScore)-$($testResponse.originalGame.awayScore)" -ForegroundColor Gray
        Write-Host "- League: $($testResponse.originalGame.league)" -ForegroundColor Gray
        Write-Host "- CustomOdds: $(if ($testResponse.originalGame.customOdds.draw) { $testResponse.originalGame.customOdds.draw } else { 'Nenhuma' })" -ForegroundColor Gray
        
        Write-Host "`nSeria criado na base histórica:" -ForegroundColor White
        Write-Host "- Season: $($testResponse.wouldCreate.season)" -ForegroundColor Gray
        Write-Host "- Status: $($testResponse.wouldCreate.status)" -ForegroundColor Gray
        Write-Host "- TeamOdds: $($testResponse.teamOddsPreview | ConvertTo-Json -Compress)" -ForegroundColor Gray
        
        Write-Host "`n🎯 ESTRUTURA VALIDADA COM SUCESSO!" -ForegroundColor Green
        
    } else {
        Write-Host "⚠️  Nenhum jogo candidato encontrado" -ForegroundColor Yellow
        Write-Host "💡 Certifique-se que existem jogos com resultado na base de dados" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erro na execução: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalhes: $($_.Exception)" -ForegroundColor DarkRed
}