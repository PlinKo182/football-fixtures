import connectToDatabase from '../../../lib/mongodb.js';
import { getHistoricalModel } from '../../../lib/historicalDataLoader.js';

export async function GET() {
  try {
    console.log('🔍 Verificando dados brutos históricos...');
    
    await connectToDatabase();
    
    // Buscar dados brutos do Bétis na época 2024-25
    const HistoricalModel = getHistoricalModel('laliga', '2024-25');
    const betisData = await HistoricalModel.findOne({ teamName: 'Bétis' }).lean();
    
    if (!betisData) {
      return Response.json({
        success: false,
        message: 'Dados do Bétis não encontrados'
      });
    }
    
    console.log(`📊 Total de jogos brutos: ${betisData.games.length}`);
    
    // Verificar os primeiros 5 jogos brutos
    const sampleRawGames = betisData.games.slice(0, 5);
    
    sampleRawGames.forEach((game, index) => {
      console.log(`\n🎮 Jogo bruto ${index + 1}:`);
      console.log(`   Oponente: ${game.opponent}`);
      console.log(`   Data: ${game.date}`);
      console.log(`   Status: ${game.status}`);
      console.log(`   teamScore: ${game.teamScore}`);
      console.log(`   opponentScore: ${game.opponentScore}`);
      console.log(`   isHome: ${game.isHome}`);
      console.log(`   Objeto completo:`, JSON.stringify(game, null, 2));
    });

    return Response.json({
      success: true,
      totalGames: betisData.games.length,
      sampleRawGames: sampleRawGames,
      teamInfo: {
        teamName: betisData.teamName,
        league: betisData.league,
        season: betisData.season
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar dados brutos:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}