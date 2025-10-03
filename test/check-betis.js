require('dotenv').config({ path: '.env.local' });
const { getAllGames } = require('../lib/dataLoader');

async function checkBetisData() {
  try {
    console.log('🔍 Verificando dados específicos do Bétis...\n');
    
    const allGames = await getAllGames();
    const now = new Date();
    const fourteenDaysLater = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
    
    console.log(`📅 Período de busca: ${now.toISOString()} até ${fourteenDaysLater.toISOString()}\n`);
    
    // Procurar Bétis em todas as ligas
    Object.entries(allGames).forEach(([leagueName, teams]) => {
      console.log(`🏆 ${leagueName}:`);
      
      teams.forEach(team => {
        if (team.teamName.toLowerCase().includes('bétis') || team.teamName.toLowerCase().includes('betis')) {
          console.log(`   ✅ Encontrado: ${team.teamName} (${team.games.length} jogos)`);
          
          // Mostrar todos os próximos jogos
          const upcomingGames = team.games.filter(game => {
            const gameDate = new Date(game.date);
            return gameDate > now;
          }).slice(0, 5);
          
          console.log('   📅 Próximos jogos:');
          upcomingGames.forEach(game => {
            const gameDate = new Date(game.date);
            const isInNext14Days = gameDate < fourteenDaysLater;
            const status = isInNext14Days ? '✅ (próximos 14 dias)' : '⏰ (depois de 14 dias)';
            
            console.log(`      ${game.date} - ${game.location === 'home' ? 'vs' : '@'} ${game.opponent} ${status}`);
          });
          
          // Verificar especificamente jogos nos próximos 14 dias
          const next14Days = team.games.filter(game => {
            const gameDate = new Date(game.date);
            return gameDate > now && gameDate < fourteenDaysLater;
          });
          
          console.log(`   🎯 Jogos nos próximos 14 dias: ${next14Days.length}`);
          if (next14Days.length > 0) {
            next14Days.forEach(game => {
              console.log(`      📍 ${game.date} - ${game.location === 'home' ? 'vs' : '@'} ${game.opponent}`);
            });
          }
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkBetisData();