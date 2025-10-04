// Archived copy of app/api/analyze-mongodb/route.js

import connectToDatabase from '../../../lib/mongodb.js';
import Game from '../../../models/Game.js';

export async function GET() {
  try {
  await connectToDatabase();
    
    console.log('🔍 Analisando dados do MongoDB vs WebApp display...');
    
    // Buscar alguns jogos com resultados
    const gamesWithResults = await Game.find({
      $or: [
        { teamScore: { $ne: null } },
        { opponentScore: { $ne: null } },
        { homeScore: { $ne: null } },
        { awayScore: { $ne: null } }
      ]
    }).limit(10).lean();
    
    console.log(`📊 Jogos com resultados no MongoDB: ${gamesWithResults.length}`);
    
    const analysis = gamesWithResults.map((game, index) => {
      console.log(`\n🎮 JOGO ${index + 1} (MongoDB):`);
      console.log(`   ${game.homeTeam} vs ${game.awayTeam}`);
      console.log(`   Status: "${game.status}"`);
      console.log(`   teamScore: ${game.teamScore}`);
      console.log(`   opponentScore: ${game.opponentScore}`);
      console.log(`   homeScore: ${game.homeScore}`);
      console.log(`   awayScore: ${game.awayScore}`);
      console.log(`   isHome: ${game.isHome}`);
      
      // Simular como o GameCard processaria este jogo
      const wouldShowResult_compact = game.status === 'finished' && (game.homeScore !== null || game.teamScore !== null);
      const wouldShowResult_normal = game.homeScore !== null && game.awayScore !== null;
      
      console.log(`   GameCard (compact) mostraria resultado: ${wouldShowResult_compact}`);
      console.log(`   GameCard (normal) mostraria resultado: ${wouldShowResult_normal}`);
      
      const displayScore_compact = wouldShowResult_compact ? 
        `${game.homeScore ?? (game.isHome ? game.teamScore : game.opponentScore) ?? 'X'}-${game.awayScore ?? (game.isHome ? game.opponentScore : game.teamScore) ?? 'X'}` : 
        'vs';
      
      const displayScore_normal = wouldShowResult_normal ? 
        `${game.homeScore} - ${game.awayScore}` : 
        'vs';
      
      console.log(`   Score display (compact): "${displayScore_compact}"`);
      console.log(`   Score display (normal): "${displayScore_normal}"`);
      
      return {
        opponent: game.opponent,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        status: game.status,
        teamScore: game.teamScore,
        opponentScore: game.opponentScore,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        isHome: game.isHome,
        date: game.date,
        wouldShowInCompact: wouldShowResult_compact,
        wouldShowInNormal: wouldShowResult_normal,
        displayScoreCompact: displayScore_compact,
        displayScoreNormal: displayScore_normal,
        problems: {
          hasScoreButScheduled: (game.teamScore !== null || game.opponentScore !== null) && game.status === 'scheduled',
          missingHomeAwayScores: game.homeScore === null || game.awayScore === null,
          statusVsResult: game.status !== 'finished' && (game.teamScore !== null || game.opponentScore !== null)
        }
      };
    });
    
    // Contar problemas
    const hasScoreButScheduled = analysis.filter(g => g.problems.hasScoreButScheduled).length;
    const missingHomeAwayScores = analysis.filter(g => g.problems.missingHomeAwayScores).length;
    const statusVsResult = analysis.filter(g => g.problems.statusVsResult).length;
    
    console.log(`\n📈 RESUMO DOS PROBLEMAS:`);
    console.log(`   Jogos com resultado mas status "scheduled": ${hasScoreButScheduled}`);
    console.log(`   Jogos sem homeScore/awayScore: ${missingHomeAwayScores}`);
    console.log(`   Status inconsistente com resultado: ${statusVsResult}`);
    
    return Response.json({
      success: true,
      totalAnalyzed: analysis.length,
      problems: {
        hasScoreButScheduled,
        missingHomeAwayScores,
        statusVsResult
      },
      analysis: analysis,
      recommendations: [
        hasScoreButScheduled > 0 ? 'Corrigir status de jogos com resultado para "finished"' : null,
        missingHomeAwayScores > 0 ? 'Adicionar homeScore/awayScore aos jogos' : null,
        'Verificar lógica de parsing do status na SportsRadar'
      ].filter(Boolean)
    });

  } catch (error) {
    console.error('❌ Erro na análise MongoDB:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
