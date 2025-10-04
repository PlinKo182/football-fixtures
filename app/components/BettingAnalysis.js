"use client";

import { useState, useEffect } from 'react';
import EditableOdds from './EditableOdds';

const MARTINGALE_PROGRESSION = [
  0.10, 0.18, 0.32, 0.57, 1.02, 1.78, 3.11, 5.43, 9.47, 16.52,
  28.08, 49.32, 86.31, 150.73, 263.28, 460.24, 804.42, 1407.73, 2463.52, 2000.00
];

function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

function calculateTotalInvested(sequenceNumber) {
  let total = 0;
  for (let i = 0; i < Math.min(sequenceNumber, MARTINGALE_PROGRESSION.length); i++) {
    total += MARTINGALE_PROGRESSION[i];
  }
  return Math.round(total * 100) / 100;
}

function calculateProfitIfWin(sequenceNumber, odds = 3.0) {
  const betAmount = MARTINGALE_PROGRESSION[Math.min(sequenceNumber - 1, MARTINGALE_PROGRESSION.length - 1)];
  const winnings = betAmount * odds;
  const totalInvested = calculateTotalInvested(sequenceNumber);
  return Math.round((winnings - totalInvested) * 100) / 100;
}

function createCompleteGameList(games, history) {
  // Sort chronologically for sequence calculation (oldest first)
  const allGamesSorted = games.sort((a, b) => new Date(a.date) - new Date(b.date));
  const completeGameList = [];
  let sequenceCounter = 1;
  let runningTotal = 0.00; // Total acumulado
  let sequenceInvested = 0.00; // Investido na sequência atual
  
  for (const game of allGamesSorted) {
    const gameDate = new Date(game.date);
    const now = new Date();
    const hasResult = game.homeScore !== null && game.homeScore !== undefined &&
                     game.awayScore !== null && game.awayScore !== undefined;
    const isPast = gameDate < now && hasResult;
    const isPostponed = gameDate < now && !hasResult && game.status !== 'scheduled';
    
    const betAmount = MARTINGALE_PROGRESSION[Math.min(sequenceCounter - 1, MARTINGALE_PROGRESSION.length - 1)];
    
    let gameStatus = 'PENDING';
    if (isPast) {
      gameStatus = hasResult ? 'COMPLETED' : 'POSTPONED';
    } else if (isPostponed) {
      gameStatus = 'POSTPONED';
    } else if (game.status === 'cancelled') {
      gameStatus = 'CANCELLED';
    }
    
  // If drawOdds is explicitly null (pending/scheduled), keep it null so UI shows blank
  const gameOdds = (typeof game.drawOdds === 'number') ? game.drawOdds : (game.customOdds?.draw || 3.0);
    
    let gameEntry = {
      game,
      sequence: sequenceCounter,
      betAmount,
      // Numeric odds for calculations
      odds: (typeof game.drawOdds === 'number') ? game.drawOdds : gameOdds,
      // Formatted odds string for display (pt-PT, two decimals)
      displayOdds: (typeof game.drawOdds === 'number' ? Number(game.drawOdds) : Number(gameOdds)).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      isPast,
      isPostponed,
      gameStatus,
      isDraw: false,
      result: null,
      profit: null,
      runningTotal: runningTotal
    };

    if (isPast) {
      // Find this game in our calculated history
      const historyEntry = history.find(h => 
        h.game.date === game.date && 
        h.game.homeTeam === game.homeTeam && 
        h.game.awayTeam === game.awayTeam
      );
      
      if (historyEntry) {
        gameEntry.isDraw = historyEntry.isDraw;
        gameEntry.result = historyEntry.result;
        gameEntry.profit = historyEntry.profit;
        
        // Calcular o total acumulado CORRETAMENTE - cada aposta é descontada imediatamente
        if (historyEntry.isDraw) {
          // WIN - Ganhou empate
          // Desconta a aposta e adiciona os ganhos (usando odds personalizadas)
          runningTotal = runningTotal - betAmount + (betAmount * gameOdds);
          
          // Reset para nova sequência
          sequenceCounter = 1;
          sequenceInvested = 0.00;
        } else {
          // LOSS - Perdeu a aposta
          // Desconta a aposta do total imediatamente
          runningTotal -= betAmount;
          sequenceCounter = Math.min(sequenceCounter + 1, MARTINGALE_PROGRESSION.length);
        }
        
        gameEntry.runningTotal = Math.round(runningTotal * 100) / 100;
      }
    } else {
      // Para jogos futuros, mostrar o total atual
      gameEntry.runningTotal = Math.round(runningTotal * 100) / 100;
    }
    
    completeGameList.push(gameEntry);
  }
  
  // Return reversed list (most recent first for display)
  return completeGameList.reverse();
}

export default function BettingAnalysis({ teamName, games }) {
  const [bettingState, setBettingState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameHistory, setGameHistory] = useState([]);
  const [allGamesWithBetting, setAllGamesWithBetting] = useState([]);

  useEffect(() => {
    async function calculateBettingHistory() {
      try {
        setLoading(true);
        
        // Filter only finished games with results, sorted by date (oldest first)
        const finishedGames = games
          .filter(game => {
            const gameDate = new Date(game.date);
            const now = new Date();
            return gameDate < now && 
                   game.homeScore !== null && game.homeScore !== undefined &&
                   game.awayScore !== null && game.awayScore !== undefined;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (finishedGames.length === 0) {
          setBettingState({
            teamName,
            currentSequence: 1,
            nextBetAmount: 0.10,
            sequenceInvested: 0.00,
            totalProfit: 0.00,
            potentialProfit: calculateProfitIfWin(1),
            gamesAnalyzed: 0,
            status: 'no-data'
          });
          setGameHistory([]);
          return;
        }

        // Simulate betting through all historical games
        let currentSequence = 1;
        let totalProfit = 0.00;
        const history = [];

        for (const game of finishedGames) {
          const isDraw = game.homeScore === game.awayScore;
          const betAmount = MARTINGALE_PROGRESSION[Math.min(currentSequence - 1, MARTINGALE_PROGRESSION.length - 1)];
          const sequenceInvested = currentSequence > 1 ? calculateTotalInvested(currentSequence - 1) : 0.00;

          // Determine the odds to use for this finished game: prefer drawOdds, then customOdds, then fallback 3.0
          const gameOdds = (typeof game.drawOdds === 'number') ? game.drawOdds : (game.customOdds?.draw || 3.0);

          if (isDraw) {
            // Win! Calculate profit for this sequence and reset using actual game odds
            const sequenceProfit = calculateProfitIfWin(currentSequence, gameOdds);
            totalProfit += sequenceProfit;

            history.push({
              game,
              sequence: currentSequence,
              betAmount,
              odds: gameOdds,
              result: 'WIN',
              profit: sequenceProfit,
              sequenceInvested: sequenceInvested + betAmount,
              isDraw: true
            });

            // Reset for next sequence
            currentSequence = 1;
          } else {
            // Loss, advance to next sequence
            history.push({
              game,
              sequence: currentSequence,
              betAmount,
              odds: gameOdds,
              result: 'LOSS',
              profit: 0,
              sequenceInvested: sequenceInvested + betAmount,
              isDraw: false
            });

            currentSequence = Math.min(currentSequence + 1, MARTINGALE_PROGRESSION.length);
          }
        }

        // Calculate current state
        const nextBetAmount = MARTINGALE_PROGRESSION[Math.min(currentSequence - 1, MARTINGALE_PROGRESSION.length - 1)];
        const sequenceInvested = currentSequence > 1 ? calculateTotalInvested(currentSequence - 1) : 0.00;
        // Use average odds from finished games to estimate potential profit
        const averageOdds = finishedGames.length > 0 ?
          finishedGames.reduce((sum, g) => sum + ((typeof g.drawOdds === 'number') ? g.drawOdds : (g.customOdds?.draw || 3.0)), 0) / finishedGames.length
          : 3.0;
        const potentialProfit = calculateProfitIfWin(currentSequence, averageOdds);

        setBettingState({
          teamName,
          currentSequence,
          nextBetAmount,
          sequenceInvested,
          totalProfit: Math.round(totalProfit * 100) / 100,
          potentialProfit,
          gamesAnalyzed: finishedGames.length,
          lastGameDate: finishedGames[finishedGames.length - 1]?.date,
          status: currentSequence === 1 ? 'fresh' : 'active'
        });

        setGameHistory(history);

        // Create complete game list with betting data (all games chronologically)
        setAllGamesWithBetting(createCompleteGameList(games, history));
        
      } catch (error) {
        console.error('Error calculating betting history:', error);
        setBettingState({
          teamName,
          currentSequence: 1,
          nextBetAmount: 0.10,
          sequenceInvested: 0.00,
          totalProfit: 0.00,
          potentialProfit: 0.20,
          gamesAnalyzed: 0,
          status: 'error'
        });
        setGameHistory([]);
        setAllGamesWithBetting([]);
      } finally {
        setLoading(false);
      }
    }

    calculateBettingHistory();
  }, [teamName, games]);

  if (loading) {
    return (
      <div style={{ 
        background: 'var(--color-surface)', 
        border: '1px solid var(--color-border-light)', 
        borderRadius: '8px', 
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Calculating betting history...
        </div>
      </div>
    );
  }

  if (!bettingState) {
    return null;
  }

  return (
    <div style={{ 
      background: 'var(--color-surface)', 
      border: '1px solid var(--color-border-light)', 
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Current State Summary */}
      <div style={{ 
        background: 'var(--color-accent-light)', 
        padding: '16px',
        borderBottom: '1px solid var(--color-border-light)'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          fontSize: '14px'
        }}>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Current Sequence</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-accent-dark)' }}>
              #{bettingState.currentSequence}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Next Bet</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-accent-dark)' }}>
              {formatCurrency(bettingState.nextBetAmount)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Invested in Sequence</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-error)' }}>
              -{formatCurrency(bettingState.sequenceInvested)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Potential Profit</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-success)' }}>
              +{formatCurrency(bettingState.potentialProfit)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Total Profit</div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: bettingState.totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'
            }}>
              {bettingState.totalProfit >= 0 ? '+' : ''}{formatCurrency(bettingState.totalProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Martingale Table - All Games Chronologically */}
      {allGamesWithBetting.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Match</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Result</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Seq#</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Bet</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Odds</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Profit/Loss</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {allGamesWithBetting.map((entry, index) => (
                <tr key={index} style={{ 
                  borderBottom: '1px solid var(--color-border-light)',
                  background: entry.isPast ? 
                    (entry.isDraw ? 'var(--color-success-light)' : 'var(--color-error-light)') :
                    'var(--color-bg)'
                }}>
                  <td style={{ padding: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {new Date(entry.game.date).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: 'short',
                      year: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    {entry.game.homeTeam} vs {entry.game.awayTeam}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                    {entry.isPast ? 
                      `${entry.game.homeScore}-${entry.game.awayScore}` : 
                      <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                    }
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                    #{entry.sequence}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>
                    {formatCurrency(entry.betAmount)}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                    <EditableOdds 
                      gameId={entry.game._id}
                      homeTeam={entry.game.homeTeam}
                      awayTeam={entry.game.awayTeam}
                      date={entry.game.date}
                      // If drawOdds is explicitly null (pending), pass null so editor shows blank
                      currentOdds={typeof entry.game.drawOdds === 'number' ? entry.game.drawOdds : (entry.game.customOdds?.draw ?? null)}
                      onOddsUpdate={(newOdds) => {
                        // Atualizar o estado local para refletir a nova odd imediatamente
                        setAllGamesWithBetting(prev => prev.map(g => {
                          try {
                            if (!g.game) return g;
                            const dateMatch = new Date(g.game.date).toISOString() === new Date(entry.game.date).toISOString();
                            const opponentMatch = (g.game.opponent || g.game.awayTeam) === (entry.game.opponent || entry.game.awayTeam);
                            const isHomeMatch = !!g.game.isHome === !!entry.game.isHome;

                            if (dateMatch && opponentMatch && isHomeMatch) {
                              return {
                                ...g,
                                game: {
                                  ...g.game,
                                  drawOdds: newOdds,
                                  hasOdds: true
                                }
                              };
                            }
                          } catch (e) {
                            return g;
                          }
                          return g;
                        }));
                        // Também logar para debug
                        console.log('Odds atualizadas (UI):', entry.game._id, newOdds);
                      }}
                    />
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'center', 
                    fontSize: '11px', 
                    fontWeight: '600',
                    color: entry.isPast ? 
                      (entry.result === 'WIN' ? 'var(--color-success)' : 'var(--color-error)') :
                      entry.gameStatus === 'POSTPONED' ? 'var(--color-warning)' :
                      entry.gameStatus === 'CANCELLED' ? 'var(--color-error)' :
                      'var(--color-accent)'
                  }}>
                    {entry.isPast ? entry.result : entry.gameStatus}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: entry.isPast ? 
                      (entry.profit > 0 ? 'var(--color-success)' : 'var(--color-error)') :
                      'var(--color-text-secondary)'
                  }}>
                    {entry.isPast ? 
                      (entry.profit > 0 ? '+' : '') + formatCurrency(entry.profit || -entry.betAmount) :
                      <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                    }
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: entry.runningTotal >= 0 ? 'var(--color-success)' : 'var(--color-error)'
                  }}>
                    {entry.runningTotal >= 0 ? '+' : ''}{formatCurrency(entry.runningTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {allGamesWithBetting.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          No games available for betting analysis.
        </div>
      )}
    </div>
  );
}