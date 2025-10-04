const MARTINGALE = [0.10, 0.18, 0.32, 0.57, 1.02, 1.78];

function calculateTotalInvested(sequenceNumber) {
  let total = 0;
  for (let i = 0; i < Math.min(sequenceNumber, MARTINGALE.length); i++) {
    total += MARTINGALE[i];
  }
  return Math.round(total * 100) / 100;
}

function simulate(seqResults) {
  // seqResults: array of objects { result: 'LOSS'|'WIN', odds?: number }
  let currentSequence = 1;
  let running = 0;
  const rows = [];

  for (const r of seqResults) {
    const bet = MARTINGALE[Math.min(currentSequence - 1, MARTINGALE.length - 1)];
    if (r.result === 'LOSS') {
      const profitRaw = -bet;
      running += profitRaw;
      rows.push({ sequence: currentSequence, bet, result: 'LOSS', profitRaw, running });
      currentSequence = Math.min(currentSequence + 1, MARTINGALE.length);
    } else if (r.result === 'WIN') {
      const odds = r.odds || 3.0;
      const totalInvested = calculateTotalInvested(currentSequence);
      const profitRaw = (bet * odds) - totalInvested;
      // user requested running to equal the sequence profit, not cumulative sum
      // but we'll show both behaviours: cumulative and "sequence-as-total"
      const rounded = Math.round(profitRaw * 100) / 100;
      rows.push({ sequence: currentSequence, bet, result: 'WIN', odds, profitRaw, rounded });
      // cumulative running
      running += profitRaw;
      rows[rows.length-1].runningCumulative = running;
      // sequence-as-total
      rows[rows.length-1].runningSequenceAsTotal = profitRaw;
      currentSequence = 1;
    }
  }
  return rows;
}

const seq = [
  { result: 'LOSS' },
  { result: 'LOSS' },
  { result: 'LOSS' },
  { result: 'WIN', odds: 3.5 }
];

const rows = simulate(seq);
console.log('Sequence simulation:');
for (const r of rows) {
  if (r.result === 'LOSS') {
    console.log(`#${r.sequence} LOSS bet=${r.bet.toFixed(2)} profit=${r.profitRaw.toFixed(2)} running=${r.running.toFixed(2)}`);
  } else {
    console.log(`#${r.sequence} WIN bet=${r.bet.toFixed(2)} odds=${r.odds} profitRaw=${r.profitRaw.toFixed(3)} rounded=${r.rounded.toFixed(2)} runningCumulative=${r.runningCumulative.toFixed(3)} runningSequenceAsTotal=${r.runningSequenceAsTotal.toFixed(3)}`);
  }
}

console.log('\nSummary:');
console.log('Cumulative running final:', rows[rows.length-1].runningCumulative.toFixed(3));
console.log('Sequence profit (raw):', rows[rows.length-1].profitRaw.toFixed(3));
console.log('Sequence profit (rounded):', rows[rows.length-1].rounded.toFixed(2));
