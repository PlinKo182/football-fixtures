// Script de teste para a migração
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3003';

async function testMigration() {
  console.log('🧪 TESTANDO SISTEMA DE MIGRAÇÃO');
  console.log('═'.repeat(50));
  
  try {
    // 1. Listar candidatos
    console.log('1️⃣ LISTANDO CANDIDATOS...');
    const candidatesResponse = await fetch(`${API_BASE}/api/migrate-game`);
    const candidatesData = await candidatesResponse.json();
    
    if (!candidatesResponse.ok) {
      console.error('❌ Erro ao listar candidatos:', candidatesData);
      return;
    }
    
    console.log(`✅ Encontrados ${candidatesData.count} candidatos:`);
    
    if (candidatesData.candidates && candidatesData.candidates.length > 0) {
      candidatesData.candidates.forEach((game, index) => {
        console.log(`${index + 1}. ${game.homeTeam} vs ${game.awayTeam}`);
        console.log(`   📅 ${new Date(game.date).toLocaleDateString('pt-PT')}`);
        console.log(`   ⚽ ${game.score}`);
        console.log(`   🎯 Odds: ${game.hasCustomOdds ? game.customOdds : 'Padrão (3.0)'}`);
        console.log(`   🆔 ${game._id}`);
        console.log('─'.repeat(30));
      });
      
      // 2. Testar migração do primeiro jogo
      const firstGameId = candidatesData.candidates[0]._id;
      console.log(`\n2️⃣ TESTANDO MIGRAÇÃO DO JOGO: ${firstGameId}`);
      
      const testResponse = await fetch(`${API_BASE}/api/migrate-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId: firstGameId, 
          testMode: true 
        })
      });
      
      const testData = await testResponse.json();
      
      if (testResponse.ok) {
        console.log('✅ TESTE DE MIGRAÇÃO CONCLUÍDO');
        console.log('Original:', {
          teams: `${testData.originalGame.homeTeam} vs ${testData.originalGame.awayTeam}`,
          date: new Date(testData.originalGame.date).toLocaleDateString('pt-PT'),
          score: `${testData.originalGame.homeScore}-${testData.originalGame.awayScore}`,
          league: testData.originalGame.league,
          customOdds: testData.originalGame.customOdds?.draw || 'Nenhuma'
        });
        
        console.log('\nSeria criado na base histórica:');
        console.log('- Season:', testData.wouldCreate.season);
        console.log('- Status:', testData.wouldCreate.status);
        console.log('- TeamOdds:', testData.teamOddsPreview);
        console.log('- MigratedAt:', new Date().toISOString());
        
        console.log('\n🎯 ESTRUTURA VALIDADA COM SUCESSO!');
      } else {
        console.error('❌ Erro no teste:', testData);
      }
    } else {
      console.log('⚠️  Nenhum jogo candidato encontrado');
      console.log('💡 Certifique-se que existem jogos com resultado na base de dados');
    }
    
  } catch (error) {
    console.error('❌ Erro na execução:', error.message);
  }
}

// Aguardar um pouco para o servidor iniciar completamente
setTimeout(() => {
  testMigration();
}, 2000);