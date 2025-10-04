"use client";

function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

export default function BettingSummary({ bettingState }) {
  if (!bettingState) return null;

  return (
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
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-accent-dark)' }}>
            #{bettingState.currentSequence}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Next Bet</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-accent-dark)' }}>
            {formatCurrency(bettingState.nextBetAmount)}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Invested in Sequence</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-error)' }}>
            -{formatCurrency(bettingState.sequenceInvested)}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Potential Profit</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-success)' }}>
            +{formatCurrency(bettingState.potentialProfit)}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Total Profit</div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: bettingState.totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'
          }}>
            {bettingState.totalProfit >= 0 ? '+' : ''}{formatCurrency(bettingState.totalProfit)}
          </div>
        </div>
      </div>
    </div>
  );
}
