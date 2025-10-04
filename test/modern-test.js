// Teste moderno das APIs usando node-fetch ou undici
const { setTimeout } = require('timers/promises');

async function testAPIs() {
  console.log('🧪 TESTANDO SISTEMA DUAL DE ODDS');
  console.log('═'.repeat(50));

  // Aguardar alguns segundos para garantir que o servidor está pronto
  await setTimeout(3000);

  try {
    // Importar fetch dinamicamente
    const { default: fetch } = await import('node-fetch');
    
    console.log('\n1️⃣ TESTANDO CHECK-GAME-STATUS...');
    const checkUrl = 'http://localhost:3000/api/check-game-status?teamName=' + 
                     encodeURIComponent('Bétis') + '&opponent=' + encodeURIComponent('Osasuna');
    
    const checkResponse = await fetch(checkUrl);
    console.log('📊 Status:', checkResponse.status);
    
    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log('✅ Resposta check-game-status:');
      console.log(JSON.stringify(checkData, null, 2));
      
      // 2. Testar definição de odds
      console.log('\n2️⃣ TESTANDO SET-ODDS...');
      if (checkData.games && checkData.games.length > 0) {
        const game = checkData.games[0];
        
        const setOddsResponse = await fetch('http://localhost:3000/api/set-odds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            teamName: 'Bétis',
            opponent: 'Osasuna',
            drawOdds: 3.25
          })
        });
        
        console.log('📊 Status set-odds:', setOddsResponse.status);
        const setOddsData = await setOddsResponse.json();
        console.log('✅ Resposta set-odds:');
        console.log(JSON.stringify(setOddsData, null, 2));
        
        // 3. Testar edição de odds
        console.log('\n3️⃣ TESTANDO EDIT-ODDS...');
        const editOddsResponse = await fetch('http://localhost:3000/api/edit-odds', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            teamName: 'Bétis',
            opponent: 'Osasuna',
            drawOdds: 3.50
          })
        });
        
        console.log('📊 Status edit-odds:', editOddsResponse.status);
        const editOddsData = await editOddsResponse.json();
        console.log('✅ Resposta edit-odds:');
        console.log(JSON.stringify(editOddsData, null, 2));
        
        // 4. Verificar novamente o status após as mudanças
        console.log('\n4️⃣ VERIFICAÇÃO FINAL...');
        const finalCheckResponse = await fetch(checkUrl);
        const finalCheckData = await finalCheckResponse.json();
        console.log('🔍 Status final:');
        console.log(JSON.stringify(finalCheckData, null, 2));
      }
    } else {
      console.log('❌ Erro na API check-game-status:', checkResponse.statusText);
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    console.log('🔍 Detalhes:', error);
  }
}

testAPIs();