import { getTeamGamesOptimized } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Teste básico - Buscando dados do Bétis...');
    
    const betisData = await getTeamGamesOptimized('Bétis');
    
    if (!betisData) {
      console.log('❌ Sem dados do Bétis');
      return Response.json({
        success: false,
        message: 'Sem dados do Bétis encontrados'
      });
    }
    
    console.log('✅ Dados do Bétis encontrados:');
    console.log(`   - Nome: ${betisData.teamName}`);
    console.log(`   - Liga: ${betisData.league}`);  
    console.log(`   - Jogos: ${betisData.games?.length || 0}`);
    
    if (betisData.games && betisData.games.length > 0) {
      const firstGame = betisData.games[0];
      console.log('   - Primeiro jogo:', {
        opponent: firstGame.opponent,
        isHome: firstGame.isHome,
        status: firstGame.status,
        teamScore: firstGame.teamScore,
        opponentScore: firstGame.opponentScore
      });
    }
    
    return Response.json({
      success: true,
      teamName: betisData.teamName,
      league: betisData.league,
      totalGames: betisData.games?.length || 0,
      firstGame: betisData.games?.[0] || null,
      lastUpdated: betisData.lastUpdated
    });

  } catch (error) {
    console.error('❌ Erro no teste básico:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}