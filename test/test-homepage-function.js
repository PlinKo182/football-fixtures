require('dotenv').config({ path: '.env.local' });
const { getAllGames } = require('./lib/dataLoader');
const { TEAMS } = require('./lib/teams');

// Função para determinar qual equipa é de interesse (das nossas equipas)
function getTeamOfInterest(homeTeam, awayTeam) {
  if (TEAMS.includes(homeTeam)) return homeTeam;
  if (TEAMS.includes(awayTeam)) return awayTeam;
  return null;
}

async function testGetUpcomingGames() {
  try {
    console.log('🔍 Testando função getUpcomingGames...\n');
    
    const allGames = await getAllGames();
    
    const upcomingGames = [];
    const addedGames = new Set();
    const now = new Date();

    // Iterar por todas as ligas e equipas
    Object.entries(allGames).forEach(([leagueName, teams]) => {
      console.log(`\n🏆 Processando ${leagueName}:`);
      
      teams.forEach(team => {
        console.log(`   📍 ${team.teamName}`);
        
        team.games.forEach(game => {
          const gameDate = new Date(game.date);
          const fourteenDaysLater = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
          
          if (gameDate > now && gameDate < fourteenDaysLater) {
            const uniqueId = `${leagueName}_${team.teamName}_${game.date}`;
            if (!addedGames.has(uniqueId)) {
              addedGames.add(uniqueId);
              const homeTeam = game.location === 'home' ? team.teamName : game.opponent;
              const awayTeam = game.location === 'home' ? game.opponent : team.teamName;
              
              const gameObj = {
                id: uniqueId,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                league: leagueName,
                date: game.date,
                time: game.time,
                status: 'scheduled',
                teamOfInterest: getTeamOfInterest(homeTeam, awayTeam)
              };
              
              upcomingGames.push(gameObj);
              console.log(`      ✅ Adicionado: ${homeTeam} vs ${awayTeam} (${game.date})`);
            }
          }
        });
      });
    });

    // Remover duplicatas
    const uniqueGames = upcomingGames.filter((game, index, self) => 
      index === self.findIndex(g => 
        g.homeTeam === game.homeTeam && 
        g.awayTeam === game.awayTeam && 
        new Date(g.date).getTime() === new Date(game.date).getTime()
      )
    );
    
    console.log(`\n📊 Resultado final:`);
    console.log(`   Total jogos adicionados: ${upcomingGames.length}`);
    console.log(`   Jogos únicos: ${uniqueGames.length}`);
    
    const finalGames = uniqueGames
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10)
      .map(game => ({
        ...game,
        date: new Date(game.date).toISOString(),
      }));
    
    console.log(`\n🎯 Próximos jogos (final):`);
    finalGames.forEach(game => {
      console.log(`   ${game.league}: ${game.homeTeam} vs ${game.awayTeam} - ${game.date}`);
    });
    
    return finalGames;
    
  } catch (error) {
    console.error('❌ Erro ao buscar jogos próximos:', error);
    console.error(error.stack);
    return [];
  }
}

testGetUpcomingGames();