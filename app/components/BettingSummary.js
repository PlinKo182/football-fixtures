"use client";

function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

export default function BettingSummary({ bettingState, hideTotalProfit = false }) {
  if (!bettingState) return null;

  return (
    <div className="betting-summary" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      <div className="container" style={{ background: 'var(--color-accent-light)', padding: '12px 0', display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px', background: 'transparent', padding: '12px 14px', borderRadius: '8px' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '6px' }}>Current Sequence</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-accent-dark)' }}>#{bettingState.currentSequence}</div>
        </div>

        <div style={{ flex: '1 1 160px', background: 'transparent', padding: '12px 14px', borderRadius: '8px' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '6px' }}>Next Bet</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-accent-dark)' }}>{formatCurrency(bettingState.nextBetAmount)}</div>
        </div>

        <div style={{ flex: '1 1 160px', background: 'transparent', padding: '12px 14px', borderRadius: '8px' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '6px' }}>Invested in Sequence</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-error)' }}>-{formatCurrency(bettingState.sequenceInvested)}</div>
        </div>

        {!hideTotalProfit && (
          <div style={{ flex: '1 1 160px', background: 'transparent', padding: '12px 14px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '6px' }}>Total Profit</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: bettingState.totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
              {bettingState.totalProfit >= 0 ? '+' : ''}{formatCurrency(bettingState.totalProfit)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
