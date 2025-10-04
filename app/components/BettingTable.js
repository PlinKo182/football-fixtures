"use client";

import EditableOdds from './EditableOdds';

function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

// parse numbers robustly: accept numbers, numeric strings, strings with comma decimals
function parseNumericCandidate(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number(v);
  if (typeof v === 'string') {
    let s = v.trim();
    // remove currency symbols/spaces
    s = s.replace(/[^0-9,.-]/g, '');
    // if uses comma as decimal separator and no dot, convert
    if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) {
      s = s.replace(/,/g, '.');
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
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
  showTeamColumn,
  allowEditExistingOdds = true,
  showProfitColumn = false,
  isSingleTeamView = false
}) {
  if (!entries || entries.length === 0) return null;

  // no debug UI in normal mode

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
            {showTeamColumnLeft && <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>TEAM</th>}
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>DATE</th>
            {showTimeColumn && <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>TIME</th>}
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>MATCH</th>
            {!hideResultColumn && <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>RESULT</th>}
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>SEQ#</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>BET</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>ODDS</th>
            {showStatusColumn && <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Status</th>}
            {!showTeamColumnLeft && showTeamColumn && <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Team</th>}
            {showProfitColumn && <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>PROFIT/LOSS</th>}
            <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>INVESTED</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            // running total candidate (cumulative). Prefer explicit entry.runningTotal
            const bsProfitRaw = entry.game?.bettingState?.totalProfit;
            const bsProfit = parseNumericCandidate(bsProfitRaw);
            const taRaw = entry.teamAggregatedProfit;
            const taProfit = parseNumericCandidate(taRaw);
            const rtRaw = entry.runningTotal;
            const rtProfit = parseNumericCandidate(rtRaw);

            const runningValue = (typeof rtProfit === 'number' && !Number.isNaN(rtProfit)) ? rtProfit
              : (typeof bsProfit === 'number' && !Number.isNaN(bsProfit) ? bsProfit : (typeof taProfit === 'number' && !Number.isNaN(taProfit) ? taProfit : null));
            // selection logic done above; no verbose debug logging in production

            return (
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
                  editable={ (entry.game.drawOdds === null || entry.game.drawOdds === undefined) || allowEditExistingOdds }
                  onOddsUpdate={(newOdds) => {
                    // Update entries locally so UI reflects change immediately
                    try {
                      entries[index].game.drawOdds = newOdds;
                    } catch(e) {
                      // ignore; entries may be immutable in some contexts
                    }
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

              {showProfitColumn && (
                <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                  {runningValue === null ? (
                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                  ) : (
                    (() => {
                      const formatted = `${runningValue < 0 ? '-' : ''}${formatCurrency(Math.abs(runningValue))}`;
                      const color = runningValue > 0 ? 'var(--color-success)' : runningValue < 0 ? 'var(--color-error)' : 'var(--color-text-primary)';
                      return <span style={{ color }}>{formatted}</span>;
                    })()
                  )}
                </td>
              )}

              <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--color-error)' }}>
                {(() => {
                  const seqNum = entry.game?.bettingState?.sequence ?? entry.sequence;
                  // Prefer an authoritative precomputed value when available (entry.sequenceInvested)
                  // which already includes the current bet. Otherwise compute total including current bet.
                  let seqInvested = null;
                  if (typeof entry.sequenceInvested === 'number' && !Number.isNaN(entry.sequenceInvested)) {
                    seqInvested = entry.sequenceInvested;
                  } else if (typeof seqNum === 'number' && seqNum > 0) {
                    seqInvested = calculateTotalInvested(seqNum);
                  } else {
                    seqInvested = 0.00;
                  }
                  return `-${formatCurrency(Math.round(seqInvested * 100) / 100)}`;
                })()}
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}
