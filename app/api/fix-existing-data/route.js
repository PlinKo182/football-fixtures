import connectToDatabase from '../../../lib/mongodb.js';
import Game from '../../../models/Game.js';
import { LEAGUE_MAPPINGS } from '../../../lib/teams.js';

export async function GET() {
  try {
  await connectToDatabase();
    
    console.log('🔧 Corrigindo dados existentes no MongoDB...');
    
    // Buscar todos os jogos com resultados mas status incorreto
    const gamesToFix = await Game.find({
      $and: [
        { status: { $ne: 'finished' } },
        {
          $or: [
            { teamScore: { $ne: null } },
            { opponentScore: { $ne: null } }
          ]
        }
      ]
    });
    
    console.log(`🎯 Jogos a corrigir: ${gamesToFix.length}`);
    
    let fixedCount = 0;
    
    for (const game of gamesToFix) {
      const updates = {};
      
      // Corrigir status
      if (game.teamScore !== null && game.opponentScore !== null) {
        updates.status = 'finished';
      }
      
      // Adicionar homeScore e awayScore se não existirem
      if (game.homeScore === null || game.awayScore === null) {
        updates.homeScore = game.isHome ? game.teamScore : game.opponentScore;
        updates.awayScore = game.isHome ? game.opponentScore : game.teamScore;
      }
      
      // Adicionar homeTeam e awayTeam se não existirem
      if (!game.homeTeam || !game.awayTeam) {
        updates.homeTeam = game.isHome ? game.team : game.opponent;
        updates.awayTeam = game.isHome ? game.opponent : game.team;
      }
      
      if (Object.keys(updates).length > 0) {
        await Game.findByIdAndUpdate(game._id, updates);
        fixedCount++;
        
        console.log(`✅ Corrigido: ${game.opponent} (${game.teamScore}-${game.opponentScore}) → status: ${updates.status}`);
      }
    }
    
    // Verificar resultado
    const verifyFixed = await Game.find({
      $and: [
        { status: 'finished' },
        {
          $or: [
            { teamScore: { $ne: null } },
            { opponentScore: { $ne: null } }
          ]
        }
      ]
    }).countDocuments();
    
    console.log(`📊 Jogos finalizados após correção: ${verifyFixed}`);
    
    return Response.json({
      success: true,
      message: 'Dados corrigidos com sucesso',
      statistics: {
        gamesAnalyzed: gamesToFix.length,
        gamesFixed: fixedCount,
        finishedGamesAfter: verifyFixed
      }
    });

  } catch (error) {
    console.error('❌ Erro ao corrigir dados:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}