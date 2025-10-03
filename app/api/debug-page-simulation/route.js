import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Simulando carregamento da página da equipa - Bétis...');
    
    // Simular exatamente o que a página [slug]/page.js faz
    const teamData = await getTeamGamesWithHistory('Bétis');
    
    console.log('📊 Resultado do getTeamGamesWithHistory:');
    console.log(`   - Dados encontrados: ${teamData ? 'Sim' : 'Não'}`);
    
    if (!teamData) {
      return Response.json({
        success: false,
        message: 'getTeamGamesWithHistory retornou null para Bétis',
        teamData: null
      });
    }
    
    console.log(`   - Nome da equipa: ${teamData.teamName}`);
    console.log(`   - Liga: ${teamData.league}`);
    console.log(`   - Total de jogos: ${teamData.games?.length || 0}`);
    console.log(`   - Épocas: ${teamData.seasons?.join(', ') || 'N/A'}`);
    
    if (teamData.games && teamData.games.length > 0) {
      // Separar por época
      const currentGames = teamData.games.filter(game => game.season === '2025-26');
      const historicalGames = teamData.games.filter(game => game.season === '2024-25');
      
      console.log(`   - Jogos época atual (2025-26): ${currentGames.length}`);
      console.log(`   - Jogos históricos (2024-25): ${historicalGames.length}`);
      
      // Verificar primeiros jogos de cada época
      console.log('\n🆕 AMOSTRA ÉPOCA ATUAL:');
      currentGames.slice(0, 2).forEach((game, index) => {
        console.log(`   ${index + 1}. ${game.homeTeam} ${game.homeScore}-${game.awayScore} ${game.awayTeam} (${game.status})`);
      });
      
      console.log('\n📜 AMOSTRA ÉPOCA HISTÓRICA:');
      historicalGames.slice(0, 2).forEach((game, index) => {
        console.log(`   ${index + 1}. ${game.homeTeam} ${game.homeScore}-${game.awayScore} ${game.awayTeam} (${game.status})`);
      });
      
      return Response.json({
        success: true,
        teamData: {
          teamName: teamData.teamName,
          league: teamData.league,
          totalGames: teamData.games.length,
          seasons: teamData.seasons,
          currentGames: currentGames.length,
          historicalGames: historicalGames.length,
          lastUpdated: teamData.lastUpdated
        },
        sampleGames: {
          current: currentGames.slice(0, 2).map(game => ({
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            status: game.status,
            season: game.season,
            date: game.date
          })),
          historical: historicalGames.slice(0, 2).map(game => ({
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            status: game.status,
            season: game.season,
            date: game.date,
            teamScore: game.teamScore,
            opponentScore: game.opponentScore
          }))
        }
      });
    }
    
    return Response.json({
      success: true,
      teamData: teamData,
      message: 'Dados encontrados mas sem jogos'
    });

  } catch (error) {
    console.error('❌ Erro ao simular carregamento da página:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}