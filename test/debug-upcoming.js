require('dotenv').config({ path: '.env.local' });
const { getAllGames } = require('./lib/dataLoader');
const { TEAMS } = require('./lib/teams');

async function debugUpcomingGames() {
  try {
    console.log('🔍 Testando lógica dos próximos jogos...\n');
    
    const allGames = await getAllGames();
    const now = new Date();
    const fourteenDaysLater = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
    
    console.log(`📅 Data atual: ${now.toISOString()}`);
    console.log(`📅 14 dias depois: ${fourteenDaysLater.toISOString()}\n`);
    
    console.log('🎯 Equipas de interesse:', TEAMS);
    console.log('\n📋 Dados por liga:');
    
    Object.entries(allGames).forEach(([leagueName, teams]) => {
      console.log(`\n🏆 ${leagueName.toUpperCase()}:`);
      console.log(`   Equipas: ${teams.length}`);
      
      teams.forEach(team => {
        console.log(`   📍 ${team.teamName} (${team.games.length} jogos)`);
        
        // Verificar próximos jogos desta equipa
        const upcomingGames = team.games.filter(game => {
          const gameDate = new Date(game.date);
          return gameDate > now && gameDate < fourteenDaysLater;
        });
        
        if (upcomingGames.length > 0) {
          console.log(`      ⚽ Próximos jogos: ${upcomingGames.length}`);
          upcomingGames.forEach(game => {
            console.log(`         ${game.date} - ${game.location === 'home' ? 'vs' : '@'} ${game.opponent}`);
          });
        } else {
          console.log(`      ❌ Sem próximos jogos nos próximos 14 dias`);
          // Mostrar os próximos 3 jogos independentemente da data
          const nextGames = team.games
            .filter(game => new Date(game.date) > now)
            .slice(0, 3);
          
          if (nextGames.length > 0) {
            console.log(`      📅 Próximos jogos (sem limite de 14 dias):`);
            nextGames.forEach(game => {
              console.log(`         ${game.date} - ${game.location === 'home' ? 'vs' : '@'} ${game.opponent}`);
            });
          }
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugUpcomingGames();