import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Debug: Página do Bétis...');
    
    const teamName = 'Bétis';
    const teamData = await getTeamGamesWithHistory(teamName, true);
    
    if (!teamData) {
      return Response.json({
        success: false,
        message: 'teamData é null'
      });
    }
    
    // Simular exatamente o que a página faz
    const games = teamData.games.map(game => ({
      _id: `${teamName}-${game.sportRadarId || Math.random()}`,
      league: teamData.league,
      homeTeam: game.isHome ? teamName : game.opponent,
      awayTeam: game.isHome ? game.opponent : teamName,
      date: game.date,
      status: game.status,
      homeScore: game.isHome ? game.teamScore : game.opponentScore,
      awayScore: game.isHome ? game.opponentScore : game.teamScore,
      season: game.season || '2025-26'
    }));
    
    console.log(`📊 Jogos mapeados: ${games.length}`);
    
    const gamesWithResults = games.filter(g => g.homeScore !== null && g.awayScore !== null);
    const finishedGames = games.filter(g => g.status === 'finished');
    
    console.log(`📈 Jogos com resultado (homeScore/awayScore): ${gamesWithResults.length}`);
    console.log(`📈 Jogos com status 'finished': ${finishedGames.length}`);
    
    // Analisar primeiros 5 jogos
    const analysis = games.slice(0, 5).map((game, index) => {
      console.log(`\n🎮 JOGO ${index + 1} (como renderizado na página):`);
      console.log(`   ${game.homeTeam} vs ${game.awayTeam}`);
      console.log(`   Status: ${game.status}`);
      console.log(`   homeScore: ${game.homeScore}`);
      console.log(`   awayScore: ${game.awayScore}`);
      console.log(`   Data: ${new Date(game.date).toLocaleDateString('pt-PT')}`);
      
      // Simular lógica do GameCard (compact mode)
      const wouldShowResult = game.status === 'finished' && (game.homeScore !== null || game.homeScore !== undefined);
      const displayScore = wouldShowResult ? `${game.homeScore}-${game.awayScore}` : 'vs';
      
      console.log(`   GameCard mostraria: "${displayScore}"`);
      console.log(`   Condição: status='${game.status}' && homeScore=${game.homeScore} !== null`);
      
      return {
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        wouldShowResult,
        displayScore,
        season: game.season
      };
    });
    
    return Response.json({
      success: true,
      debug: {
        originalGamesCount: teamData.games.length,
        mappedGamesCount: games.length,
        gamesWithResults: gamesWithResults.length,
        finishedGames: finishedGames.length
      },
      analysis,
      firstRawGame: teamData.games[0],
      firstMappedGame: games[0]
    });

  } catch (error) {
    console.error('❌ Erro no debug da página:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}