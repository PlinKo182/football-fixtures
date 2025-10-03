import { getTeamHistoricalGames } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Verificando marcadores dos dados históricos...');
    
    const historicalGames = await getTeamHistoricalGames('Bétis');
    
    console.log(`📊 Total de jogos históricos: ${historicalGames.length}`);
    
    // Verificar os primeiros 5 jogos
    const sampleGames = historicalGames.slice(0, 5);
    
    sampleGames.forEach((game, index) => {
      console.log(`\n🎮 Jogo ${index + 1}:`);
      console.log(`   Oponente: ${game.opponent}`);
      console.log(`   Data: ${game.date}`);
      console.log(`   Status: ${game.status}`);
      console.log(`   teamScore: ${game.teamScore}`);
      console.log(`   opponentScore: ${game.opponentScore}`);
      console.log(`   isHome: ${game.isHome}`);
    });

    return Response.json({
      success: true,
      totalGames: historicalGames.length,
      sampleGames: sampleGames.map(game => ({
        opponent: game.opponent,
        date: game.date,
        status: game.status,
        teamScore: game.teamScore,
        opponentScore: game.opponentScore,
        isHome: game.isHome
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao verificar dados históricos:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}