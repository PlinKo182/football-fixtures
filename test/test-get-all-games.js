require('dotenv').config({ path: '.env.local' });

async function testGetAllGames() {
  try {
    console.log('🔍 Testando getAllGames diretamente...\n');
    
    // Importar a função
    const { getAllGames } = await import('../lib/dataLoader.js');
    
    console.log('📊 Chamando getAllGames...');
    const allGames = await getAllGames();
    
    console.log('📋 Resultado getAllGames:');
    console.log('Keys:', Object.keys(allGames));
    
    Object.entries(allGames).forEach(([league, teams]) => {
      console.log(`\n${league} (${teams.length} equipas):`);
      teams.forEach(team => {
        console.log(`   - ${team.teamName}: ${team.games.length} jogos`);
        
        // Mostrar próximos jogos
        const now = new Date();
        const upcomingGames = team.games.filter(game => {
          const gameDate = new Date(game.date);
          return gameDate > now;
        }).slice(0, 2);
        
        if (upcomingGames.length > 0) {
          console.log(`     Próximos: ${upcomingGames.map(g => `vs ${g.opponent} (${new Date(g.date).toLocaleDateString('pt-PT')})`).join(', ')}`);
        } else {
          console.log('     Sem jogos próximos');
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }
}

testGetAllGames();