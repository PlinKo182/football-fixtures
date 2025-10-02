const testAPI = async () => {
  console.log('🎯 TESTE DIRETO À API LOCAL...\n');
  
  try {
    // Chamar a API update-fixtures
    console.log('📞 Chamando /api/update-fixtures...');
    const response = await fetch('http://localhost:3000/api/update-fixtures', {
      method: 'POST'
    });
    
    const result = await response.json();
    console.log('✅ Resposta:', JSON.stringify(result, null, 2));
    
    console.log('\n🏠 Chamando homepage...');
    const homeResponse = await fetch('http://localhost:3000/');
    console.log(`   Status: ${homeResponse.status}`);
    
    if (homeResponse.ok) {
      const html = await homeResponse.text();
      const gameCount = (html.match(/game-card/g) || []).length;
      console.log(`   Jogos encontrados: ${gameCount}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
};

testAPI();