import { getAllGames } from '@/lib/dataLoader';
import { TEAMS } from '@/lib/teams';
import { getTeamGamesWithHistory } from '@/lib/teamLoader';
import Link from 'next/link';
import GameCard from './components/GameCard';
import AutoDataLoader from './components/AutoDataLoader';
import ImportHistoricalButton from './components/ImportHistoricalButton';
import ThemeToggle from './components/ThemeToggle';

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
    const allGames = await getAllGames();
    
    const upcomingGames = [];
    const addedGames = new Set();
    const now = new Date();

    // Iterate through all leagues and teams
    Object.entries(allGames).forEach(([leagueName, teams]) => {
      teams.forEach(team => {
        team.games.forEach(game => {
          const gameDate = new Date(game.date);
          const fourteenDaysLater = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
          
          if (gameDate > now && gameDate < fourteenDaysLater) {
            const uniqueId = `${leagueName}_${team.teamName}_${game.date}`;
            if (!addedGames.has(uniqueId)) {
              addedGames.add(uniqueId);
              const homeTeam = game.isHome ? team.teamName : game.opponent;
              const awayTeam = game.isHome ? game.opponent : team.teamName;
              
              upcomingGames.push({
                id: uniqueId,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                league: leagueName,
                date: game.date,
                status: 'scheduled',
                teamOfInterest: getTeamOfInterest(homeTeam, awayTeam)
              });
            }
          }
        });
      });
    });

    // Remove duplicates
    const uniqueGames = upcomingGames.filter((game, index, self) => 
      index === self.findIndex(g => 
        g.homeTeam === game.homeTeam && 
        g.awayTeam === game.awayTeam && 
        new Date(g.date).getTime() === new Date(game.date).getTime()
      )
    );

    // Calculate betting states for teams of interest
    const gamesWithBetting = await Promise.all(
      uniqueGames.map(async (game) => {
        let bettingState = null;
        
        if (game.teamOfInterest) {
          bettingState = await calculateTeamBettingState(game.teamOfInterest);
        }

        return {
          ...game,
          date: new Date(game.date).toISOString(),
          bettingState
        };
      })
    );
    
    return gamesWithBetting
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);
    
  } catch (error) {
    console.error('❌ Error fetching upcoming games:', error);
    console.error(error.stack);
    return [];
  }
}

export default async function Home() {
  const upcomingGames = await getUpcomingGamesWithBetting();
  const hasData = upcomingGames.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AutoDataLoader />

      <header className="header-compact">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title-compact">Football Fixtures</h1>
            <p className="page-subtitle-compact">Next matches • Martingale betting system • Updated automatically</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container">
        {!hasData && (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '8px', margin: '32px 0' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>No Data Available</div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>The system will automatically load data from SportRadar API</div>
          </div>
        )}
        
        {/* Button to import historical data */}
        {hasData && (
          <div className="mb-8">
            <ImportHistoricalButton />
          </div>
        )}



        {/* Martingale System Info */}
        {upcomingGames.length > 0 && (
          <div style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent)', borderRadius: '8px', padding: '16px', margin: '24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', marginRight: '8px' }}>🎯</span>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-accent-dark)', margin: '0' }}>
                Martingale Betting System
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-accent-dark)', margin: '0', lineHeight: '1.4' }}>
              Click ⚡ next to any match to start betting on draws. System starts at €0.10, doubles on loss, resets on draw win. 
              Odds default to 3.0. Each successful sequence yields €0.20 profit.
            </p>
          </div>
        )}

        <div className="matches-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 className="section-title">Upcoming Matches</h2>
            {upcomingGames.length > 0 && (
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{upcomingGames.length} matches</span>
            )}
          </div>
          
          {upcomingGames.length > 0 ? (
            <div>
              {upcomingGames.map((game) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  highlightTeam={game.teamOfInterest}
                  isRecent={false}
                  showBetting={true}
                />
              ))}
            </div>
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
