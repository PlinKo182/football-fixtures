import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';
import { NextRequest } from 'next/server';

export async function GET(request) {
  try {
    // Forçar recarregamento sem cache
    const teamData = await getTeamGamesWithHistory('Bétis', true);
    
    if (!teamData || !teamData.games) {
      return Response.json({
        success: false,
        message: 'Sem dados encontrados'
      });
    }

    // Pegar os primeiros 3 jogos históricos para análise
    const historicalGames = teamData.games
      .filter(game => game.season === '2024-25')
      .slice(0, 3);

    const analysis = historicalGames.map(game => {
      return {
        original: {
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          teamScore: game.teamScore,
          opponentScore: game.opponentScore,
          status: game.status,
          isHome: game.isHome,
          opponent: game.opponent
        },
        analysis: {
          hasHomeScore: game.homeScore !== null && game.homeScore !== undefined,
          hasAwayScore: game.awayScore !== null && game.awayScore !== undefined,
          hasTeamScore: game.teamScore !== null && game.teamScore !== undefined,
          hasOpponentScore: game.opponentScore !== null && game.opponentScore !== undefined,
          statusCheck: game.status === 'finished',
          conditionMet: (game.status === 'finished' || (game.homeScore !== null && game.awayScore !== null))
        }
      };
    });

    return Response.json({
      success: true,
      totalGames: teamData.games.length,
      historicalGamesCount: teamData.games.filter(g => g.season === '2024-25').length,
      analysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na análise:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}