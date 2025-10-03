import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Testando dados combinados do Bétis...');
    
    const teamData = await getTeamGamesWithHistory('Bétis');
    
    if (!teamData) {
      return Response.json({
        success: false,
        message: 'Dados do Bétis não encontrados'
      });
    }
    
    // Separar jogos por época
    const currentSeasonGames = teamData.games.filter(game => game.season === '2025-26').slice(0, 3);
    const historicalGames = teamData.games.filter(game => game.season === '2024-25').slice(0, 3);
    
    console.log(`📊 Total de jogos: ${teamData.games.length}`);
    console.log(`📊 Jogos época atual: ${currentSeasonGames.length}`);
    console.log(`📊 Jogos históricos: ${historicalGames.length}`);
    
    console.log('\n🆕 JOGOS ÉPOCA ATUAL (2025-26):');
    currentSeasonGames.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.homeTeam} ${game.homeScore}-${game.awayScore} ${game.awayTeam} (${game.status})`);
    });
    
    console.log('\n📜 JOGOS HISTÓRICOS (2024-25):');
    historicalGames.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.homeTeam} ${game.homeScore}-${game.awayScore} ${game.awayTeam} (${game.status})`);
    });

    return Response.json({
      success: true,
      totalGames: teamData.games.length,
      currentSeasonSample: currentSeasonGames.map(game => ({
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        status: game.status,
        season: game.season,
        date: game.date
      })),
      historicalSample: historicalGames.map(game => ({
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        status: game.status,
        season: game.season,
        date: game.date,
        teamScore: game.teamScore,
        opponentScore: game.opponentScore,
        isHome: game.isHome,
        opponent: game.opponent
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao testar dados combinados:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}