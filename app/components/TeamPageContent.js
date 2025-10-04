import { getTeamGamesWithHistory } from '@/lib/teamLoader';
import { TEAMS } from '@/lib/teams';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import GameCard from '@/app/components/GameCard';
import ThemeToggle from '@/app/components/ThemeToggle';
import BettingAnalysis from '@/app/components/BettingAnalysis';
import PageHeaderCompact from './PageHeaderCompact';
import SectionHeader from './SectionHeader';

export default async function TeamPageContent({ params }) {
  const resolvedParams = await params;
  const teamName = decodeURIComponent(resolvedParams.slug);
  
  // Check if the team exists in the list
  if (!TEAMS.includes(teamName)) {
    notFound();
  }

  const teamData = await getTeamGamesWithHistory(teamName, true);
  
  if (!teamData) {
    notFound();
  }

  // Convert to expected format (minimum necessary) including season AND ODDS
  const games = teamData.games.map(game => ({
    _id: `${teamName}-${game.sportRadarId || Math.random()}`,
    league: teamData.league,
    homeTeam: game.homeTeam || (game.isHome ? teamName : game.opponent),
    awayTeam: game.awayTeam || (game.isHome ? game.opponent : teamName),
    date: game.date,
    status: game.status,
    // Use homeScore/awayScore directly if they exist, otherwise map from teamScore/opponentScore
    homeScore: game.homeScore !== null && game.homeScore !== undefined ? 
               game.homeScore : 
               (game.isHome ? game.teamScore : game.opponentScore),
    awayScore: game.awayScore !== null && game.awayScore !== undefined ? 
               game.awayScore : 
               (game.isHome ? game.opponentScore : game.teamScore),
    season: game.season || '2025-26', // Fallback to current season
    // 🎯 CRUCIAL: Preserve odds properties
    hasOdds: game.hasOdds || false,
    drawOdds: game.drawOdds,
    // Keep original data for debugging
    opponent: game.opponent,
    isHome: game.isHome
  }));

  // 🔍 DEBUG: Log games with odds after conversion
  const gamesWithOddsAfterConversion = games.filter(g => g.hasOdds);
  console.log(`🎯 PAGE.JS - Após conversão: ${gamesWithOddsAfterConversion.length} jogos com odds`);
  if (gamesWithOddsAfterConversion.length > 0) {
    console.log('🎯 PAGE.JS - Primeiro jogo com odds após conversão:', {
      homeTeam: gamesWithOddsAfterConversion[0].homeTeam,
      awayTeam: gamesWithOddsAfterConversion[0].awayTeam,
      hasOdds: gamesWithOddsAfterConversion[0].hasOdds,
      drawOdds: gamesWithOddsAfterConversion[0].drawOdds,
      opponent: gamesWithOddsAfterConversion[0].opponent,
      date: gamesWithOddsAfterConversion[0].date
    });
  }

  // Separate games by season
  const currentSeasonGames = games.filter(game => game.season === '2025-26');
  const historicalGames = games.filter(game => game.season === '2024-25');
  
  // Calculate upcoming games for header (current season only)
  const upcomingGames = currentSeasonGames.filter(game => new Date(game.date) >= new Date());

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <PageHeaderCompact
        title={teamName}
        subtitle={`${games.length} total games • ${upcomingGames.length} upcoming`}
        rightActions={(
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <Link
              href="/"
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', padding: '8px 16px' }}
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>
        )}
      />

      <main className="container">
        {/* Betting System Analysis */}
        {games.length > 0 && (
          <div className="matches-container" style={{ marginBottom: '32px' }}>
            <SectionHeader title={`🎯 Martingale Betting Analysis`} />
            
            {/* Betting State Display */}
                <BettingAnalysis teamName={teamName} games={games} showProfitColumn={true} allowEditExistingOdds={true} />
          </div>
        )}

        {games.length === 0 && (
          <div className="matches-container">
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-light)',
              borderRadius: '8px'
            }}>
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '1px solid var(--color-border)'
              }}>
                <svg style={{ width: '32px', height: '32px', color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                No games found
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                No games were found for {teamName}.
              </p>
              <p style={{
                background: 'var(--color-primary-light)',
                color: 'var(--color-accent)',
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                💡 Run the fixtures update to load data
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
