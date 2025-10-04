"use client";

import { useState, useEffect } from 'react';
import EditableOdds from './EditableOdds';
import BettingSummary from './BettingSummary';
import BettingTable from './BettingTable';

const MARTINGALE_PROGRESSION = [
  0.10, 0.17, 0.28, 0.48, 0.80, 1.35, 2.28, 3.84, 6.47, 10.90,
  18.35, 30.91, 52.05, 87.66, 147.63, 248.63, 418.72, 705.16, 1187.57, 2000.00
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
  // Per-game net profit if the bet at this sequence wins: stake * (odds - 1)
  const betAmount = MARTINGALE_PROGRESSION[Math.min(sequenceNumber - 1, MARTINGALE_PROGRESSION.length - 1)];
  const net = betAmount * (odds - 1);
  return Math.round(net * 100) / 100;
}

function createCompleteGameList(games, history, opts = {}) {
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
        gameEntry.sequenceInvested = historyEntry.sequenceInvested;

        // Use the authoritative values from historyEntry so the running total
        // is accurate even in mixed-team views. historyEntry.profit is
        // already calculated using the real odds for that finished game.
        const entrySequence = typeof historyEntry.sequence === 'number' ? historyEntry.sequence : sequenceCounter;

        if (historyEntry.isDraw) {
          // WIN - use per-game net profit = bet * (odds - 1)
          // Add this net profit to the cumulative running total (not replace)
          const betForEntry = MARTINGALE_PROGRESSION[Math.min(Math.max(entrySequence - 1, 0), MARTINGALE_PROGRESSION.length - 1)];
          const computedProfitRaw = betForEntry * (gameOdds - 1);
          const winProfit = (typeof historyEntry.profitRaw === 'number' ? historyEntry.profitRaw : (typeof historyEntry.profit === 'number' ? historyEntry.profit : computedProfitRaw));
          runningTotal += winProfit;

          // Reset sequence for next betting series
          sequenceCounter = 1;
          sequenceInvested = 0.00;
        } else {
          // LOSS - subtract the actual bet amount that was staked for this sequence
          const lossBetAmount = MARTINGALE_PROGRESSION[Math.min(Math.max(entrySequence - 1, 0), MARTINGALE_PROGRESSION.length - 1)];
          runningTotal -= lossBetAmount;

          // Advance sequence based on the recorded sequence
          sequenceCounter = Math.min(entrySequence + 1, MARTINGALE_PROGRESSION.length);
        }

        // Expose both rounded profit (for display) and raw profit used for
        // running total calculations if present.
        gameEntry.profit = historyEntry.profit;
        gameEntry.profitRaw = historyEntry.profitRaw;
        gameEntry.runningTotal = Math.round(runningTotal * 100) / 100;
      }
    } else {
      // Para jogos futuros, mostrar o total atual
      gameEntry.runningTotal = Math.round(runningTotal * 100) / 100;
    }
    
    completeGameList.push(gameEntry);
  }
  
  // Return reversed list (most recent first for display) unless caller
  // requests preserving chronological order (oldest→newest).
  if (opts && opts.preserveOrder) return completeGameList;
  return completeGameList.reverse();
}

export default function BettingAnalysis({ teamName, games, showEmptyGamesTable = false, showTeamColumn = false, showTeamColumnLeft = false, showTimeColumn = false, hideResultColumn = false, forceFutureGames = false, showSummary = true, allowEditExistingOdds = true, showProfitColumn = false }) {
  const [bettingState, setBettingState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameHistory, setGameHistory] = useState([]);
  const [allGamesWithBetting, setAllGamesWithBetting] = useState([]);

  // Determine if this view is for a single team (used to decide how to display P/L)
  // If `teamName` is provided (team page), always treat as single-team view.
  const teamSet = new Set((games || []).map(g => g.teamOfInterest).filter(Boolean));
  const isSingleTeamView = Boolean(teamName) || teamSet.size === 1;

  useEffect(() => {
    async function calculateBettingHistory() {
      try {
        setLoading(true);
        // DEBUG: log input games coming into this component
        try {
          console.log('DEBUG BettingAnalysis: input games count=', Array.isArray(games) ? games.length : 'not-array');
          console.log('DEBUG BettingAnalysis: sample input games=', (Array.isArray(games) && games.slice(0,5)) || games);
        } catch(e) {
          console.log('DEBUG BettingAnalysis: error logging input games', e);
        }
        
  // Filter only finished games with results, sorted by date (oldest first)

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
          if (!showEmptyGamesTable) {
            return;
          }
          // if showEmptyGamesTable is true, continue and build the complete list (history is empty)
        }

  // If requested, force all games to be treated as future/upcoming (no scores)
  const processedGames = forceFutureGames ? games.map(g => ({ ...g, homeScore: null, awayScore: null, status: 'scheduled' })) : games;

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
            // Win! Use per-game net profit = bet * (odds - 1)
            const profitRaw = betAmount * (gameOdds - 1);
            const sequenceProfit = Math.round(profitRaw * 100) / 100; // rounded for display
            totalProfit += sequenceProfit;

            history.push({
              game,
              sequence: currentSequence,
              betAmount,
              odds: gameOdds,
              result: 'WIN',
              profit: sequenceProfit,
              profitRaw: profitRaw,
              sequenceInvested: sequenceInvested + betAmount,
              isDraw: true
            });

            // Reset for next sequence
            currentSequence = 1;
          } else {
            // Loss, advance to next sequence
            // Record the loss as negative of the bet amount so per-game P/L
            // reflects the actual stake lost.
            history.push({
              game,
              sequence: currentSequence,
              betAmount,
              odds: gameOdds,
              result: 'LOSS',
              profit: -betAmount,
              profitRaw: -betAmount,
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
        // DEBUG: compute and log the complete list before setting state
        try {
          const completeList = createCompleteGameList(games, history, { preserveOrder: !!forceFutureGames });
          console.log('DEBUG BettingAnalysis: completeGameList length=', completeList.length);
          console.log('DEBUG BettingAnalysis: completeGameList sample=', completeList.slice(0,6));
          // For mixed-team views (homepage) compute an accurate per-team totalProfit
          // by simulating only the finished games for each team independently.
          const teamGames = {};
          for (const g of games || []) {
            const teamKey = g.teamOfInterest || g.homeTeam || g.awayTeam || 'Unknown';
            if (!teamGames[teamKey]) teamGames[teamKey] = [];
            teamGames[teamKey].push(g);
          }

          const teamProfitMap = {};
          const now = new Date();
          // For each team, build a per-team history and use createCompleteGameList
          // so the per-team TotalProfit matches the team page's calculation
          for (const [teamKey, tGames] of Object.entries(teamGames)) {
            // Consider only finished games for this team, sorted oldest-first
            const finished = (tGames || []).filter(g => {
              const d = new Date(g.date);
              return d < now && g.homeScore !== null && g.homeScore !== undefined && g.awayScore !== null && g.awayScore !== undefined;
            }).sort((a, b) => new Date(a.date) - new Date(b.date));

            // Build a minimal history array for this team using the exact same
            // rules as the main simulation (wins use real odds, losses are -bet)
            let currentSequenceForTeam = 1;
            const historyForTeam = [];
            for (const g of finished) {
              const isDraw = g.homeScore === g.awayScore;
              const gameOdds = (typeof g.drawOdds === 'number') ? g.drawOdds : (g.customOdds?.draw || 3.0);
              const betAmount = MARTINGALE_PROGRESSION[Math.min(currentSequenceForTeam - 1, MARTINGALE_PROGRESSION.length - 1)];
              if (isDraw) {
                const profitRaw = betAmount * (gameOdds - 1);
                const sequenceProfit = Math.round(profitRaw * 100) / 100;
                historyForTeam.push({ game: g, sequence: currentSequenceForTeam, betAmount, odds: gameOdds, result: 'WIN', profit: sequenceProfit, profitRaw: profitRaw, sequenceInvested: calculateTotalInvested(currentSequenceForTeam) + betAmount });
                currentSequenceForTeam = 1;
              } else {
                historyForTeam.push({ game: g, sequence: currentSequenceForTeam, betAmount, odds: gameOdds, result: 'LOSS', profit: -betAmount, profitRaw: -betAmount, sequenceInvested: calculateTotalInvested(currentSequenceForTeam) });
                currentSequenceForTeam = Math.min(currentSequenceForTeam + 1, MARTINGALE_PROGRESSION.length);
              }
            }

            // Use createCompleteGameList to get the runningTotal for this team's games
            try {
              const completeListForTeam = createCompleteGameList(tGames, historyForTeam);
              const latestRunning = (completeListForTeam && completeListForTeam.length > 0) ? completeListForTeam[0].runningTotal : 0.00;
              teamProfitMap[teamKey] = Math.round((typeof latestRunning === 'number' ? latestRunning : 0) * 100) / 100;
            } catch (e) {
              console.error('Error computing team profit for', teamKey, e);
              teamProfitMap[teamKey] = 0.00;
            }
          }

          const completeWithTeamProfit = completeList.map(entry => {
            const teamKey = entry.game.teamOfInterest || entry.game.homeTeam || entry.game.awayTeam || 'Unknown';
            // Prefer authoritative server-provided bettingState.totalProfit when present
            const bsTotal = entry.game?.bettingState?.totalProfit;
            const derived = (typeof teamProfitMap[teamKey] === 'number' ? teamProfitMap[teamKey] : null);
            const finalTeamProfit = (typeof bsTotal === 'number' && !Number.isNaN(bsTotal)) ? bsTotal : derived;
            return { ...entry, teamAggregatedProfit: (typeof finalTeamProfit === 'number' ? Math.round(finalTeamProfit * 100) / 100 : null) };
          });

          // Debug: show a compact sample to verify teamAggregatedProfit / bettingState
          try {
            const sample = completeWithTeamProfit.slice(0, 6).map(e => ({
              team: e.game.teamOfInterest || e.game.homeTeam || e.game.awayTeam,
              teamAggregatedProfit: e.teamAggregatedProfit,
              bettingStateTotal: e.game?.bettingState?.totalProfit
            }));
            console.log('DEBUG completeWithTeamProfit sample:', sample);
          } catch (dd) {
            console.log('DEBUG error preparing sample', dd);
          }
          setAllGamesWithBetting(completeWithTeamProfit);
          // Ensure the header "Total Profit" shows the latest running total from
          // the complete list (most recent game's runningTotal). This makes the
          // top summary reflect the current cumulative P/L shown in the table.
          const latestRunning = (completeWithTeamProfit && completeWithTeamProfit.length > 0) ? completeWithTeamProfit[0].runningTotal : null;
          if (typeof latestRunning === 'number' && !Number.isNaN(latestRunning)) {
            setBettingState(prev => ({ ...(prev || {}), totalProfit: Math.round(latestRunning * 100) / 100 }));
          }
        } catch (e) {
          console.error('DEBUG BettingAnalysis: error creating completeGameList', e);
          setAllGamesWithBetting([]);
        }
        // If this component is rendering a mixed set of teams (homepage), prefer
        // to show per-game bettingState (which the server attached) rather than
        // the aggregated calculation above which assumes a single team.
        if (!isSingleTeamView) {
          // Aggregate totalProfit across teams (if available) so top summary shows something useful
          const aggTotal = (games || []).reduce((sum, g) => sum + ((g.bettingState?.totalProfit) || 0), 0);
          setBettingState(prev => ({
            teamName: 'Multiple',
            currentSequence: '-',
            nextBetAmount: 0.00,
            sequenceInvested: 0.00,
            totalProfit: Math.round(aggTotal * 100) / 100,
            potentialProfit: 0.00,
            gamesAnalyzed: finishedGames.length,
            status: 'mixed'
          }));
        }
        
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
  }, [teamName, games, showEmptyGamesTable, forceFutureGames, isSingleTeamView]);

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

  // If all games are future (no past/completed entries), hide the Status column
  const showStatusColumn = (allGamesWithBetting || []).some(entry => entry.isPast === true);

  return (
    <div style={{ 
      background: 'var(--color-surface)', 
      border: '1px solid var(--color-border-light)', 
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
  {showSummary && <BettingSummary bettingState={bettingState} />}

      {allGamesWithBetting.length > 0 && (
        <BettingTable
          entries={allGamesWithBetting}
          showTeamColumnLeft={showTeamColumnLeft}
          showTimeColumn={showTimeColumn}
          hideResultColumn={hideResultColumn}
          showStatusColumn={showStatusColumn}
          showTeamColumn={showTeamColumn}
          showProfitColumn={showProfitColumn}
          allowEditExistingOdds={allowEditExistingOdds}
          isSingleTeamView={isSingleTeamView}
        />
      )}

      {allGamesWithBetting.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          No games available for betting analysis.
        </div>
      )}
    </div>
  );
}