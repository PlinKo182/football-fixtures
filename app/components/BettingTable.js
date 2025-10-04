"use client";

import EditableOdds from './EditableOdds';

function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

const MARTINGALE_PROGRESSION = [
  0.10, 0.18, 0.32, 0.57, 1.02, 1.78, 3.11, 5.43, 9.47, 16.52,
  28.08, 49.32, 86.31, 150.73, 263.28, 460.24, 804.42, 1407.73, 2463.52, 2000.00
];

function calculateTotalInvested(sequenceNumber) {
  let total = 0;
  for (let i = 0; i < Math.min(sequenceNumber, MARTINGALE_PROGRESSION.length); i++) {
    total += MARTINGALE_PROGRESSION[i];
  }
  return Math.round(total * 100) / 100;
}

export default function BettingTable({
  entries,
  showTeamColumnLeft,
  showTimeColumn,
  hideResultColumn,
  showStatusColumn,
  showTeamColumn
}) {
  if (!entries || entries.length === 0) return null;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
            {showTeamColumnLeft && <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>TEAM</th>}
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>DATE</th>
            {showTimeColumn && <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>TIME</th>}
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>MATCH</th>
            {!hideResultColumn && <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Result</th>}
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Seq#</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Bet</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Odds</th>
            {showStatusColumn && <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Status</th>}
            {!showTeamColumnLeft && showTeamColumn && <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Team</th>}
            <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>INVESTED</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={index} style={{ 
              borderBottom: '1px solid var(--color-border-light)',
              background: entry.isPast ? 
                (entry.isDraw ? 'var(--color-success-light)' : 'var(--color-error-light)') :
                'var(--color-bg)'
            }}>
              {showTeamColumnLeft && (
                <td style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>
                  {entry.game.teamOfInterest ? (
                    <a href={`/team/${encodeURIComponent(entry.game.teamOfInterest)}`} className="team-focus" style={{ fontWeight: 600 }}>{entry.game.teamOfInterest}</a>
                  ) : (
                    <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                  )}
                </td>
              )}

              <td style={{ padding: '8px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                {new Date(entry.game.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
              </td>

              {showTimeColumn && (
                <td style={{ padding: '8px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                  {new Date(entry.game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              )}

              <td style={{ padding: '8px', fontSize: '12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '45%', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '6px', fontWeight: 600 }}>{entry.game.homeTeam}</div>
                  <div style={{ width: '10%', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 700 }}>- : -</div>
                  <div style={{ width: '45%', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingLeft: '6px', fontWeight: 600 }}>{entry.game.awayTeam}</div>
                </div>
              </td>

              {!hideResultColumn && (
                <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                  {entry.isPast ? `${entry.game.homeScore}-${entry.game.awayScore}` : <span style={{ color: 'var(--color-text-secondary)' }}>-</span>}
                </td>
              )}

              <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>#{entry.game.bettingState?.sequence || entry.sequence}</td>

              <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                {formatCurrency(typeof entry.game.bettingState?.nextBet === 'number' ? entry.game.bettingState.nextBet : entry.betAmount)}
              </td>

              <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                <EditableOdds
                  gameId={entry.game._id}
                  homeTeam={entry.game.homeTeam}
                  awayTeam={entry.game.awayTeam}
                  date={entry.game.date}
                  currentOdds={typeof entry.game.drawOdds === 'number' ? entry.game.drawOdds : (entry.game.customOdds?.draw ?? null)}
                  onOddsUpdate={(newOdds) => {
                    // Local UI update handled by parent; this is just to keep component API consistent
                    console.log('Odds atualizadas (UI):', entry.game._id, newOdds);
                  }}
                />
              </td>

              {showStatusColumn && (
                <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: entry.isPast ? (entry.result === 'WIN' ? 'var(--color-success)' : 'var(--color-error)') : entry.gameStatus === 'POSTPONED' ? 'var(--color-warning)' : entry.gameStatus === 'CANCELLED' ? 'var(--color-error)' : 'var(--color-accent)'}}>
                  {entry.isPast ? entry.result : entry.gameStatus}
                </td>
              )}

              {!showTeamColumnLeft && showTeamColumn && (
                <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>
                  {entry.game.teamOfInterest ? (
                    <a href={`/team/${encodeURIComponent(entry.game.teamOfInterest)}`} className="team-focus" style={{ fontWeight: 600 }}>{entry.game.teamOfInterest}</a>
                  ) : (
                    <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                  )}
                </td>
              )}

              <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--color-error)' }}>
                {(() => {
                  const seqNum = entry.game?.bettingState?.sequence ?? entry.sequence;
                  const seqInvested = seqNum > 1 ? calculateTotalInvested(seqNum - 1) : 0.00;
                  return `-${formatCurrency(seqInvested)}`;
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
