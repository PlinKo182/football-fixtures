// Utility to calculate current betting sequence based on historical games
import { getTeamGamesWithHistory } from '@/lib/teamLoader';

const MARTINGALE_PROGRESSION = [
  0.10, 0.18, 0.32, 0.57, 1.02, 1.78, 3.11, 5.43, 9.47, 16.52,
  28.08, 49.32, 86.31, 150.73, 263.28, 460.24, 804.42, 1407.73, 2463.52, 2000.00
];

// Calculate total invested up to a specific sequence (inclusive)
function calculateTotalInvested(sequenceNumber) {
  let total = 0;
  for (let i = 0; i < Math.min(sequenceNumber, MARTINGALE_PROGRESSION.length); i++) {
    total += MARTINGALE_PROGRESSION[i];
  }
  return Math.round(total * 100) / 100;
}

// Calculate profit if winning at specific sequence with given odds
function calculateProfitIfWin(sequenceNumber, odds = 3.0) {
  const betAmount = MARTINGALE_PROGRESSION[Math.min(sequenceNumber - 1, MARTINGALE_PROGRESSION.length - 1)];
  const winnings = betAmount * odds;
  const totalInvested = calculateTotalInvested(sequenceNumber);
  return Math.round((winnings - totalInvested) * 100) / 100;
}

export async function calculateCurrentBettingState(teamName) {
  try {
    // Get team games with historical data
    const teamData = await getTeamGamesWithHistory(teamName, true);
    
    if (!teamData || !teamData.games) {
      return {
        teamName,
        currentSequence: 1,
        nextBetAmount: 0.10,
        sequenceInvested: 0.00,
        totalProfit: 0.00,
        potentialProfit: calculateProfitIfWin(1),
        gamesAnalyzed: 0,
        lastGameDate: null,
        status: 'no-data'
      };
    }
    
    // Convert games to format needed for betting calculation
    const finishedGames = teamData.games
      .filter(game => {
        const gameDate = new Date(game.date);
        const now = new Date();
        return gameDate < now && 
               game.homeScore !== null && game.homeScore !== undefined &&
               game.awayScore !== null && game.awayScore !== undefined;
      })
      .map(game => ({
        date: game.date,
        homeTeam: game.homeTeam || (game.isHome ? teamName : game.opponent),
        awayTeam: game.awayTeam || (game.isHome ? game.opponent : teamName),
        homeScore: game.homeScore !== null && game.homeScore !== undefined ? 
                   game.homeScore : 
                   (game.isHome ? game.teamScore : game.opponentScore),
        awayScore: game.awayScore !== null && game.awayScore !== undefined ? 
                   game.awayScore : 
                   (game.isHome ? game.opponentScore : game.teamScore),
  // ODDS DO JOGO - ESSENCIAL PARA MARTINGALE
  // If drawOdds is explicitly null (pending), keep null; only default for finished games
  drawOdds: (typeof game.drawOdds === 'number') ? game.drawOdds : (game.customOdds?.draw || 3.0),
        isDraw: function() {
          return this.homeScore === this.awayScore;
        },
        season: game.season || '2025-26'
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first
    
    if (finishedGames.length === 0) {
      // No historical games, start fresh
      return {
        teamName,
        currentSequence: 1,
        nextBetAmount: 0.10,
        sequenceInvested: 0.00,
        totalProfit: 0.00,
        potentialProfit: calculateProfitIfWin(1),
        gamesAnalyzed: 0,
        lastGameDate: null,
        status: 'new'
      };
    }
    
    // Simulate betting through all historical games with REAL ODDS
    let currentSequence = 1;
    let totalProfit = 0.00;
    
    for (const game of finishedGames) {
      const isDraw = game.isDraw();
  // For finished games, game.drawOdds should be a number; otherwise default to 3.0
  const gameOdds = (typeof game.drawOdds === 'number') ? game.drawOdds : 3.0; // Usar odds reais do jogo
      
      if (isDraw) {
        // Win! Calculate profit for this sequence with REAL odds and reset
        const sequenceProfit = calculateProfitIfWin(currentSequence, gameOdds);
        totalProfit += sequenceProfit;
        
        // Reset for next sequence
        currentSequence = 1;
      } else {
        // Loss, advance to next sequence
        currentSequence = Math.min(currentSequence + 1, MARTINGALE_PROGRESSION.length);
      }
    }
    
    // Calculate current state (usar odds médias para próxima aposta estimada)
    const nextBetAmount = MARTINGALE_PROGRESSION[Math.min(currentSequence - 1, MARTINGALE_PROGRESSION.length - 1)];
    const sequenceInvested = currentSequence > 1 ? calculateTotalInvested(currentSequence - 1) : 0.00;
    
    // Para potencial profit, usar odds médias dos jogos históricos ou default
    const averageOdds = finishedGames.length > 0 ? 
      finishedGames.reduce((sum, game) => sum + game.drawOdds, 0) / finishedGames.length : 3.0;
    const potentialProfit = calculateProfitIfWin(currentSequence, averageOdds);
    
    return {
      teamName,
      currentSequence,
      nextBetAmount,
      sequenceInvested,
      totalProfit: Math.round(totalProfit * 100) / 100,
      potentialProfit,
      gamesAnalyzed: finishedGames.length,
      lastGameDate: finishedGames[finishedGames.length - 1]?.date,
      status: currentSequence === 1 ? 'fresh' : 'active'
    };
    
  } catch (error) {
    console.error(`Error calculating betting state for ${teamName}:`, error);
    return {
      teamName,
      currentSequence: 1,
      nextBetAmount: 0.10,
      totalInvested: 0.00,
      totalProfit: 0.00,
      sequenceInvested: 0.00,
      potentialProfit: 0.20,
      gamesAnalyzed: 0,
      lastGameDate: null,
      status: 'error'
    };
  }
}