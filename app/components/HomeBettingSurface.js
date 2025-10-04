import React from 'react';

// Replicates the top 'BettingAnalysis' surface visually.
export default function HomeBettingSurface({ games }) {
  // derive representative values so the UI shows realistic numbers
  const upcomingCount = games.length;
  const firstMatch = games[0];
  const lastMatch = games[games.length - 1];

  // derive a simple aggregate for nextBet and totalProfit from available bettingState
  const bettingStates = games.map(g => g.bettingState).filter(Boolean);
  const nextBet = bettingStates.length > 0 ? bettingStates[0].nextBet : 0.18;
  const totalProfit = bettingStates.reduce((s, b) => s + (b?.totalProfit || 0), 0).toFixed(2);
  const invested = bettingStates.length > 0 ? -0.10 : 0.00;
  const potentialProfit = bettingStates.length > 0 ? 0.30 : 0.00;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border-light)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
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
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-accent-dark)' }}>#{bettingStates[0]?.sequence ?? 2}</div>
          </div>

          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Next Bet</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-accent-dark)' }}>€{Number(nextBet).toFixed(2)}</div>
          </div>

          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Invested in Sequence</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-error)' }}>-{invested.toFixed(2) ? `€${Math.abs(invested).toFixed(2)}` : '€0.00'}</div>
          </div>

          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Potential Profit</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-success)' }}>+€{Number(potentialProfit).toFixed(2)}</div>
          </div>

          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Total Profit</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: Number(totalProfit) >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
              {Number(totalProfit) >= 0 ? '+' : ''}€{Math.abs(totalProfit)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
