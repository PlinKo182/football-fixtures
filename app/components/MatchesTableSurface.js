import React from 'react';
import Link from 'next/link';

// Recebe: games (array), showTeamCol (bool), teamColLabel (string)
export default function MatchesTableSurface({ games, showTeamCol = true, teamColLabel = 'Team' }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ background: 'var(--color-accent-light)', padding: '12px', borderBottom: '1px solid var(--color-border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-accent-dark)' }}>Upcoming Matches</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{games.length} matches</div>
        </div>
      </div>
      <div className="matches-table-container" style={{ overflowX: 'auto' }}>
        <table className="matches-table" style={{ width: '100%', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Time</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Home</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', width: '60px' }}></th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Away</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Odds</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Status</th>
              {showTeamCol && <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>{teamColLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {games.map((game, index) => {
              const gameDate = new Date(game.date);
              const now = new Date();
              const msDiff = gameDate - now;
              const isNext24h = game.status === 'scheduled' && msDiff > 0 && msDiff <= 24 * 60 * 60 * 1000;
              const formattedDate = gameDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Europe/Lisbon' }).replace(/\s/, ' ');
              const formattedTime = gameDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Lisbon' });
              return (
                <tr key={game.id || index} className={isNext24h ? 'urgent' : ''} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{formattedDate}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{formattedTime}</td>
                  <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right' }}>{game.homeTeam}</td>
                  <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}><span className="vs-text">vs</span></td>
                  <td style={{ padding: '8px', fontSize: '12px', textAlign: 'left' }}>{game.awayTeam}</td>
                  <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>{(typeof game.drawOdds === 'number') ? Number(game.drawOdds).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (game.customOdds?.draw ?? '—')}</td>
                  <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: 600 }}>{game.status === 'live' ? 'LIVE' : (game.status === 'finished' ? 'FT' : (game.status === 'postponed' ? 'PP' : ''))}</td>
                  {showTeamCol && (
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>{game.teamOfInterest ? (<Link href={`/team/${encodeURIComponent(game.teamOfInterest)}`} className="team-focus">{game.teamOfInterest}</Link>) : (<span style={{ color: 'var(--color-text-secondary)' }}>-</span>)}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
