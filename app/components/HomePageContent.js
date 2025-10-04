import { getAllGames } from '@/lib/dataLoader';
import { TEAMS } from '@/lib/teams';
import { getTeamGamesWithHistory, getTeamGamesFromApostas, getUpcomingFromApostas } from '@/lib/teamLoader';
import Link from 'next/link';
import MatchesTableSurface from '../components/MatchesTableSurface';
import BettingAnalysis from './BettingAnalysis';
import HomeBettingSurface from './HomeBettingSurface';
import AutoDataLoader from './AutoDataLoader';
// historical import button removed per user request
import PageHeaderCompact from './PageHeaderCompact';
import SectionHeader from './SectionHeader';

const MARTINGALE_PROGRESSION = [
  0.10, 0.18, 0.32, 0.57, 1.02, 1.78, 3.11, 5.43, 9.47, 16.52,
  28.08, 49.32, 86.31, 150.73, 263.28, 460.24, 804.42, 1407.73, 2463.52, 2000.00
];

async function calculateTeamBettingState(teamName) {
  try {
    const teamData = await getTeamGamesWithHistory(teamName, true);
    if (!teamData || !teamData.games) return null;

    // Convert to expected format
    const games = teamData.games.map(game => ({
      homeTeam: game.homeTeam || (game.isHome ? teamName : game.opponent),
      awayTeam: game.awayTeam || (game.isHome ? game.opponent : teamName),
      date: game.date,
      homeScore: game.homeScore !== null && game.homeScore !== undefined ? 
                 game.homeScore : 
                 (game.isHome ? game.teamScore : game.opponentScore),
      awayScore: game.awayScore !== null && game.awayScore !== undefined ? 
                 game.awayScore : 
                 (game.isHome ? game.opponentScore : game.teamScore),
    }));

    // Filter finished games, sorted by date (oldest first)
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
      return { sequence: 1, nextBet: 0.10, totalProfit: 0 };
    }

    // Simulate betting through historical games
    let currentSequence = 1;
    let totalProfit = 0;

    for (const game of finishedGames) {
      const isDraw = game.homeScore === game.awayScore;
      
      if (isDraw) {
        // Win! Calculate profit and reset sequence
        const betAmount = MARTINGALE_PROGRESSION[Math.min(currentSequence - 1, MARTINGALE_PROGRESSION.length - 1)];
        const winnings = betAmount * 3.0;
        let totalInvested = 0;
        for (let i = 0; i < currentSequence; i++) {
          totalInvested += MARTINGALE_PROGRESSION[Math.min(i, MARTINGALE_PROGRESSION.length - 1)];
        }
        const sequenceProfit = winnings - totalInvested;
        totalProfit += sequenceProfit;
        currentSequence = 1; // Reset
      } else {
        // Loss, advance sequence
        currentSequence = Math.min(currentSequence + 1, MARTINGALE_PROGRESSION.length);
      }
    }

    const nextBetAmount = MARTINGALE_PROGRESSION[Math.min(currentSequence - 1, MARTINGALE_PROGRESSION.length - 1)];

    return {
      sequence: currentSequence,
      nextBet: nextBetAmount,
      totalProfit: Math.round(totalProfit * 100) / 100
    };

  } catch (error) {
    console.error(`Error calculating betting state for ${teamName}:`, error);
    return null;
  }
}

// Function to determine which team is of interest (from our teams)
function getTeamOfInterest(homeTeam, awayTeam) {
  if (TEAMS.includes(homeTeam)) return homeTeam;
  if (TEAMS.includes(awayTeam)) return awayTeam;
  return null;
}

async function getUpcomingGamesWithBetting() {
  try {
    const upcomingGames = [];
    const addedGames = new Set();
    const now = new Date();

    const rawUpcoming = await getUpcomingFromApostas({ withinDays: 14, limit: 200 });
    for (const g of rawUpcoming) {
      upcomingGames.push({
        ...g,
        teamOfInterest: getTeamOfInterest(g.homeTeam, g.awayTeam)
      });
    }

    const uniqueTeams = [...new Set(upcomingGames.map(g => g.teamOfInterest).filter(Boolean))];
    const bettingStateMap = {};
    if (uniqueTeams.length > 0) {
      const states = await Promise.all(uniqueTeams.map(async (t) => {
        try {
          const s = await calculateTeamBettingState(t);
          return { team: t, state: s };
        } catch (e) {
          console.error('Error calculating betting state for', t, e);
          return { team: t, state: null };
        }
      }));
      for (const s of states) {
        bettingStateMap[s.team] = s.state;
      }
    }

    const uniqueGames = upcomingGames.filter((game, index, self) => 
      index === self.findIndex(g => 
        g.homeTeam === game.homeTeam && 
        g.awayTeam === game.awayTeam && 
        new Date(g.date).getTime() === new Date(game.date).getTime()
      )
    );

    const gamesWithBetting = uniqueGames.map((game) => {
      const bettingState = game.teamOfInterest ? (bettingStateMap[game.teamOfInterest] || null) : null;
      return {
        ...game,
        date: new Date(game.date).toISOString(),
        bettingState
      };
    });
    
    return gamesWithBetting
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);
    
  } catch (error) {
    console.error('❌ Error fetching upcoming games:', error);
    console.error(error.stack);
    return [];
  }
}

export default async function HomePageContent() {
  const upcomingGames = await getUpcomingGamesWithBetting();
  const hasData = upcomingGames.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AutoDataLoader />

      <PageHeaderCompact title={"Football Fixtures"} subtitle={"Next matches • Martingale betting system • Updated automatically"} />

      <main className="container">
        {!hasData && (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '8px', margin: '32px 0' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>No Data Available</div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>The system will automatically load data from SportRadar API</div>
          </div>
        )}
        
        {/* historical import button removed per user request */}

        {/* Martingale banner removed per user request */}

        <div className="matches-container" style={{ marginBottom: '32px' }}>
          {/* Top summary and section header removed on homepage per user request */}
          {upcomingGames.length > 0 ? (
            (() => {
              const converted = upcomingGames.map((g, i) => ({
                _id: g.id || `upcoming-${i}`,
                league: g.league || 'Various',
                homeTeam: g.homeTeam,
                awayTeam: g.awayTeam,
                date: g.date,
                status: g.status || 'scheduled',
                homeScore: null,
                awayScore: null,
                season: '2025-26',
                // Preserve odds coming from Apostas (if present)
                hasOdds: (typeof g.drawOdds === 'number') || !!g.hasOdds,
                drawOdds: (typeof g.drawOdds === 'number') ? g.drawOdds : (g.drawOdds ?? null),
                teamOfInterest: g.teamOfInterest || null,
                bettingState: g.bettingState || null,
                isHome: null
              }));
              return (<BettingAnalysis teamName={"Upcoming"} games={converted} showEmptyGamesTable={true} showTeamColumn={true} showTeamColumnLeft={true} showTimeColumn={true} hideResultColumn={true} forceFutureGames={true} showSummary={false} allowEditExistingOdds={false} showProfitColumn={true} />);
            })()
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '8px' }}>
              <div style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                {!hasData ? 'Loading data...' : 'No upcoming matches found'}
              </div>
            </div>
          )}
        </div>
      </main>

      <a href="/api/update-fixtures" target="_blank" className="update-btn">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Update Fixtures
      </a>
    </div>
  );
}
