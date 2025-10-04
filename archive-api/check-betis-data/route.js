import connectToDatabase from '../../../lib/mongodb.js';
import Game from '../../../models/Game.js';

export async function GET() {
  try {
  await connectToDatabase();
    
    console.log('🔍 Verificando dados do Bétis no MongoDB...');
    
    // Buscar todos os jogos do Bétis
    const betisGames = await Game.find({
      $or: [
        { team: { $regex: /bétis/i } },
        { opponent: { $regex: /bétis/i } },
        { homeTeam: { $regex: /bétis/i } },
        { awayTeam: { $regex: /bétis/i } }
      ]
    }).sort({ date: -1 }).limit(20).lean();
    
    console.log(`📊 Total jogos do Bétis encontrados: ${betisGames.length}`);
    
    const gameAnalysis = betisGames.map((game, index) => {
      console.log(`\n🎮 JOGO ${index + 1}:`);
      console.log(`   Data: ${new Date(game.date).toLocaleDateString('pt-PT')}`);
      console.log(`   Oponente: ${game.opponent || 'N/A'}`);
      console.log(`   Casa/Fora: ${game.isHome ? 'Casa' : 'Fora'}`);
      console.log(`   Status: "${game.status}"`);
      console.log(`   teamScore: ${game.teamScore}`);
      console.log(`   opponentScore: ${game.opponentScore}`);
      console.log(`   homeScore: ${game.homeScore}`);
      console.log(`   awayScore: ${game.awayScore}`);
      console.log(`   homeTeam: ${game.homeTeam || 'N/A'}`);
      console.log(`   awayTeam: ${game.awayTeam || 'N/A'}`);
      console.log(`   SportsRadar ID: ${game.sportRadarId || 'N/A'}`);
      
      const hasResult = game.teamScore !== null || game.opponentScore !== null;
      const hasHomeAwayResult = game.homeScore !== null || game.awayScore !== null;
      
      return {
        date: game.date,
        opponent: game.opponent,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        isHome: game.isHome,
        status: game.status,
        teamScore: game.teamScore,
        opponentScore: game.opponentScore,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        hasResult: hasResult,
        hasHomeAwayResult: hasHomeAwayResult,
        displayScore: hasResult ? `${game.teamScore}-${game.opponentScore}` : 'Sem resultado',
        displayHomeAway: hasHomeAwayResult ? `${game.homeScore}-${game.awayScore}` : 'Sem resultado',
        sportRadarId: game.sportRadarId
      };
    });
    
    // Estatísticas
    const withResults = gameAnalysis.filter(g => g.hasResult).length;
    const withHomeAwayResults = gameAnalysis.filter(g => g.hasHomeAwayResult).length;
    const finishedGames = gameAnalysis.filter(g => g.status === 'finished').length;
    const scheduledWithResults = gameAnalysis.filter(g => g.status === 'scheduled' && g.hasResult).length;
    
    console.log(`\n📈 ESTATÍSTICAS:`);
    console.log(`   Jogos com teamScore/opponentScore: ${withResults}/${gameAnalysis.length}`);
    console.log(`   Jogos com homeScore/awayScore: ${withHomeAwayResults}/${gameAnalysis.length}`);
    console.log(`   Jogos com status 'finished': ${finishedGames}/${gameAnalysis.length}`);
    console.log(`   Jogos com resultado mas status 'scheduled': ${scheduledWithResults}`);
    
    return Response.json({
      success: true,
      totalGames: gameAnalysis.length,
      statistics: {
        withResults,
        withHomeAwayResults,
        finishedGames,
        scheduledWithResults
      },
      games: gameAnalysis.slice(0, 10), // Primeiros 10 para não sobrecarregar
      allGames: gameAnalysis // Todos os jogos para debug
    });

  } catch (error) {
    console.error('❌ Erro ao verificar dados do Bétis:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}