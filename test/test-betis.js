require('dotenv').config({ path: '.env.local' });
const { getAllGames } = require('../lib/dataLoader');

async function testBetisVariations() {
  try {
    console.log('🔍 Testando variações do nome Real Betis...');
    
    // Testar com diferentes variações
    const variations = [
      'Real Betis',
      'Real Bétis', 
      'Betis',
      'Real Betis Balompié',
      'Real Betis Sevilla'
    ];
    
    console.log('\n📋 Variações a testar:');
    variations.forEach(variation => {
      console.log(`   - "${variation}"`);
    });
    
    // Forçar uma atualização e ver que equipas são encontradas
    const allGames = await getAllGames();
    
    console.log('\n✅ Equipas encontradas após getAllGames():');
    Object.entries(allGames).forEach(([league, teams]) => {
      console.log(`\n📋 ${league}:`);
      teams.forEach(team => {
        console.log(`   - "${team.teamName}" (${team.games.length} jogos)`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testBetisVariations();