import Link from 'next/link';
import BettingInfo from './BettingInfo';

export default function GameCard({ game, isRecent = false, highlightTeam = null, isCompact = false, showBetting = false }) {
  const gameDate = new Date(game.date);
  const now = new Date();
  const msDiff = gameDate - now;
  const isNext24h =
    game.status === 'scheduled' &&
    msDiff > 0 &&
    msDiff <= 24 * 60 * 60 * 1000;

  // Format date as "05 Oct" - consistent format
  const formattedDate = gameDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Europe/Lisbon'
  }).replace(/\s/, ' ');

  // Format time as "15:30"
  const formattedTime = gameDate.toLocaleTimeString('pt-PT', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Lisbon'
  });

  // Get status info - only show important statuses
  const getStatusInfo = () => {
    if (game.status === 'live') return { text: 'LIVE', class: 'status-live', show: true };
    if (game.status === 'finished' || (isRecent && game.homeScore !== null && game.awayScore !== null)) {
      return { text: 'FT', class: 'status-finished', show: true };
    }
    if (game.status === 'postponed' || (new Date(game.date) < new Date() && (game.homeScore === null || game.awayScore !== null))) {
      return { text: 'PP', class: 'status-postponed', show: true };
    }
    return { text: '', class: '', show: false }; // Hide scheduled status
  };

  const status = getStatusInfo();

  return (
    <div className={`match-card ${isNext24h ? 'match-card-urgent' : ''}`}>
      <div className="match-row">
        {/* Team Focus */}
        <div style={{ width: '120px', display: 'flex', alignItems: 'center', height: '40px', marginRight: '48px', position: 'relative' }}>
          {highlightTeam && (
            <Link href={`/team/${encodeURIComponent(highlightTeam)}`} className="team-focus">
              {highlightTeam}
            </Link>
          )}
        </div>

        {/* Date & Time */}
        <div className="match-meta" style={{ marginRight: '32px' }}>
          <div className="match-date">{formattedDate}</div>
          <div className="match-time">{formattedTime}</div>
        </div>

        {/* Teams and Score */}
        <div className="match-teams">
          <div className="team-section team-home">
            <span className="team-name">{game.homeTeam}</span>
          </div>
          
          <div className="match-score">
            {isRecent && game.homeScore !== null && game.awayScore !== null ? (
              <span className="score-display">{game.homeScore}-{game.awayScore}</span>
            ) : (
              <span className="vs-text">vs</span>
            )}
          </div>
          
          <div className="team-section team-away">
            <span className="team-name">{game.awayTeam}</span>
          </div>
        </div>

        {/* Status - only show for important statuses */}
        {status.show && (
          <div className="match-status" style={{ marginLeft: '16px' }}>
            <span className={`status-badge ${status.class}`}>{status.text}</span>
          </div>
        )}

        {/* Betting Info - só aparece se showBetting for true */}
        {showBetting && (
          <div className="betting-section" style={{ marginLeft: '16px' }}>
            <BettingInfo 
              gameId={game.id || `${game.homeTeam}-${game.awayTeam}-${game.date}`}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
              gameDate={game.date}
              gameStatus={game.status}
              gameResult={game.homeScore !== null && game.awayScore !== null ? {
                homeScore: game.homeScore,
                awayScore: game.awayScore
              } : null}
              bettingState={game.bettingState}
            />
          </div>
        )}
      </div>
    </div>
  );

}