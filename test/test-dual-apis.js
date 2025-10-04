// Script de teste das APIs do sistema dual
const API_BASE = 'http://localhost:3000';

async function testAPIs() {
  console.log('🧪 TESTANDO SISTEMA DUAL DE ODDS');
  console.log('═'.repeat(50));

  try {
    // 1. Testar verificação de status primeiro
    console.log('\n1️⃣ TESTANDO CHECK-GAME-STATUS...');
    const statusResponse = await fetch(`${API_BASE}/api/check-game-status?team=Bétis`);
    const statusData = await statusResponse.json();
    
    if (statusResponse.ok) {
      console.log('✅ Status API funcionando');
      console.log(`📊 ${statusData.teamName}: ${statusData.summary.totalGames} jogos`);
      console.log(`🎯 Com odds: ${statusData.summary.withCustomOdds}`);
      console.log(`⚡ Pode definir: ${statusData.summary.canDefineOdds}`);
      
      // Procurar um jogo futuro sem odd para testar
      const jogoParaTestar = statusData.games.upcoming.find(j => !j.hasCustomOdds);
      
      if (jogoParaTestar) {
        console.log(`\n🎯 Jogo encontrado para teste:`);
        console.log(`   ${jogoParaTestar.homeTeam} vs ${jogoParaTestar.awayTeam}`);
        console.log(`   📅 ${new Date(jogoParaTestar.date).toLocaleDateString('pt-PT')}`);
        
        // 2. Testar definir odd
        console.log('\n2️⃣ TESTANDO SET-ODDS...');
        const setOddsResponse = await fetch(`${API_BASE}/api/set-odds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            homeTeam: jogoParaTestar.homeTeam,
            awayTeam: jogoParaTestar.awayTeam,
            date: jogoParaTestar.date,
            drawOdds: 3.2
          })
        });
        
        const setOddsData = await setOddsResponse.json();
        
        if (setOddsResponse.ok) {
          console.log('✅ Set-odds funcionando');
          console.log(`🎯 Odd definida: ${setOddsData.game.drawOdds}`);
          console.log('⚡ Jogo migrado para base Apostas');
          
          // 3. Testar editar odd
          console.log('\n3️⃣ TESTANDO EDIT-ODDS...');
          const editOddsResponse = await fetch(`${API_BASE}/api/edit-odds`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              homeTeam: jogoParaTestar.homeTeam,
              awayTeam: jogoParaTestar.awayTeam,
              date: jogoParaTestar.date,
              drawOdds: 3.5 // Corrigir odd
            })
          });
          
          const editOddsData = await editOddsResponse.json();
          
          if (editOddsResponse.ok) {
            console.log('✅ Edit-odds funcionando');
            console.log(`🎯 Odd atualizada: ${editOddsData.game.drawOdds}`);
            console.log(`📊 Equipas atualizadas: ${editOddsData.updatedTeams}`);
          } else {
            console.log('❌ Edit-odds erro:', editOddsData.error);
          }
          
        } else {
          console.log('❌ Set-odds erro:', setOddsData.error);
        }
        
      } else {
        console.log('⚠️  Nenhum jogo futuro sem odd encontrado para teste');
        
        // Testar com dados fixos se não houver jogo disponível
        console.log('\n2️⃣ TESTANDO SET-ODDS (dados de exemplo)...');
        const testResponse = await fetch(`${API_BASE}/api/set-odds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            homeTeam: 'Bétis',
            awayTeam: 'Barcelona',
            date: '2025-12-15',
            drawOdds: 3.8
          })
        });
        
        const testData = await testResponse.json();
        console.log('Resposta do teste:', testData.error || 'Sucesso');
      }
      
    } else {
      console.log('❌ Status API erro:', statusData.error);
    }
    
    // 4. Verificar novamente o status após mudanças
    console.log('\n4️⃣ VERIFICANDO STATUS APÓS MUDANÇAS...');
    const finalStatusResponse = await fetch(`${API_BASE}/api/check-game-status?team=Bétis`);
    const finalStatusData = await finalStatusResponse.json();
    
    if (finalStatusResponse.ok) {
      console.log('✅ Status final:');
      console.log(`📊 Total: ${finalStatusData.summary.totalGames} jogos`);
      console.log(`🎯 Com odds: ${finalStatusData.summary.withCustomOdds}`);
      console.log(`⚡ Pode definir: ${finalStatusData.summary.canDefineOdds}`);
      
      // Mostrar alguns jogos com odds
      const jogosComOdds = finalStatusData.games.all.filter(j => j.hasCustomOdds);
      if (jogosComOdds.length > 0) {
        console.log('\n🎯 JOGOS COM ODDS DEFINIDAS:');
        jogosComOdds.slice(0, 3).forEach((jogo, i) => {
          console.log(`${i+1}. ${jogo.homeTeam} vs ${jogo.awayTeam}`);
          console.log(`   🎯 Odd: ${jogo.drawOdds}`);
          console.log(`   📅 ${new Date(jogo.date).toLocaleDateString('pt-PT')}`);
          console.log(`   📍 Fonte: ${jogo.source}`);
        });
      }
    }
    
    console.log('\n🎉 TESTE DAS APIs CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Aguardar servidor iniciar completamente
setTimeout(() => {
  testAPIs();
}, 3000);