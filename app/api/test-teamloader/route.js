import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Testando teamLoader para Bétis...');
    
    const teamData = await getTeamGamesWithHistory('Bétis', true);
    
    if (!teamData) {
      return Response.json({
        success: false,
        message: 'Nenhum dado encontrado para Bétis'
      });
    }
    
    console.log(`📊 Total jogos retornados: ${teamData.games.length}`);
    
    // Analisar os primeiros 10 jogos
    const gameAnalysis = teamData.games.slice(0, 10).map((game, index) => {
      console.log(`\n🎮 JOGO ${index + 1} (teamLoader):`);
      console.log(`   Oponente: ${game.opponent}`);
      console.log(`   Data: ${new Date(game.date).toLocaleDateString('pt-PT')}`);
      console.log(`   Casa/Fora: ${game.isHome ? 'Casa' : 'Fora'}`);
      console.log(`   Status: ${game.status}`);
      console.log(`   teamScore: ${game.teamScore}`);
      console.log(`   opponentScore: ${game.opponentScore}`);
      console.log(`   homeScore: ${game.homeScore}`);
      console.log(`   awayScore: ${game.awayScore}`);
      console.log(`   homeTeam: ${game.homeTeam}`);
      console.log(`   awayTeam: ${game.awayTeam}`);
      console.log(`   season: ${game.season}`);
      
      return {
        opponent: game.opponent,
        date: game.date,
        isHome: game.isHome,
        status: game.status,
        teamScore: game.teamScore,
        opponentScore: game.opponentScore,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        season: game.season,
        hasTeamResult: game.teamScore !== null && game.opponentScore !== null,
        hasHomeAwayResult: game.homeScore !== null && game.awayScore !== null
      };
    });
    
    const stats = {
      totalGames: teamData.games.length,
      withTeamResults: teamData.games.filter(g => g.teamScore !== null && g.opponentScore !== null).length,
      withHomeAwayResults: teamData.games.filter(g => g.homeScore !== null && g.awayScore !== null).length,
      finishedGames: teamData.games.filter(g => g.status === 'finished').length
    };
    
    console.log(`\n📈 ESTATÍSTICAS teamLoader:`);
    console.log(`   Total: ${stats.totalGames}`);
    console.log(`   Com teamScore/opponentScore: ${stats.withTeamResults}`);
    console.log(`   Com homeScore/awayScore: ${stats.withHomeAwayResults}`);
    console.log(`   Status 'finished': ${stats.finishedGames}`);
    
    return Response.json({
      success: true,
      teamData: {
        teamName: teamData.teamName,
        league: teamData.league,
        totalGames: teamData.games.length
      },
      statistics: stats,
      sampleGames: gameAnalysis,
      rawFirstGame: teamData.games[0] // Para debug completo
    });

  } catch (error) {
    console.error('❌ Erro no teste teamLoader:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}