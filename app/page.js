import { getAllGames } from '@/lib/dataLoader';
import { TEAMS } from '@/lib/teams';
import Link from 'next/link';
import GameCard from './components/GameCard';
import AutoDataLoader from './components/AutoDataLoader';
import ImportHistoricalButton from './components/ImportHistoricalButton';
import ThemeToggle from './components/ThemeToggle';

// Function to determine which team is of interest (from our teams)
function getTeamOfInterest(homeTeam, awayTeam) {
  if (TEAMS.includes(homeTeam)) return homeTeam;
  if (TEAMS.includes(awayTeam)) return awayTeam;
  return null;
}

async function getUpcomingGames() {
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
    


    return uniqueGames
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10)
      .map(game => ({
        ...game,
        date: new Date(game.date).toISOString(),
      }));
    
  } catch (error) {
    console.error('❌ Error fetching upcoming games:', error);
    console.error(error.stack);
    return [];
  }
}

export default async function Home() {
  const upcomingGames = await getUpcomingGames();
  const hasData = upcomingGames.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AutoDataLoader />

      <header className="header-compact">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title-compact">Football Fixtures</h1>
            <p className="page-subtitle-compact">Next matches • Updated automatically</p>
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
