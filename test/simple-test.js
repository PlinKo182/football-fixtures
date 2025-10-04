// Teste simples das APIs
const http = require('http');

// Aguardar alguns segundos antes de testar
setTimeout(() => {
  console.log('🧪 Testando APIs...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/check-game-status?teamName=' + encodeURIComponent('Bétis') + '&opponent=' + encodeURIComponent('Atl. Bilbao'),
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('✅ API check-game-status status:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('📋 Resposta:', JSON.stringify(jsonData, null, 2));
      } catch (error) {
        console.log('📋 Resposta raw:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Erro ao testar:', error.message);
  });

  req.end();
}, 5000);