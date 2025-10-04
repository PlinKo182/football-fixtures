"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BettingInfo from './BettingInfo';

// Clean GameCard component
export default function GameCard({ game, isRecent = false, highlightTeam = null, isCompact = false, showBetting = false }) {
  const gameDate = new Date(game.date);
  const now = new Date();
  const msDiff = gameDate - now;
  const isNext24h = game.status === 'scheduled' && msDiff > 0 && msDiff <= 24 * 60 * 60 * 1000;

  const formattedDate = gameDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Europe/Lisbon' }).replace(/\s/, ' ');
  const formattedTime = gameDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Lisbon' });

  const getStatusInfo = () => {
    if (game.status === 'live') return { text: 'LIVE', class: 'status-live', show: true };
    if (game.status === 'finished' || (isRecent && game.homeScore !== null && game.awayScore !== null)) return { text: 'FT', class: 'status-finished', show: true };
    if (game.status === 'postponed') return { text: 'PP', class: 'status-postponed', show: true };
    return { text: '', class: '', show: false };
  };

  const status = getStatusInfo();

  return (
    <div className={`match-card ${isNext24h ? 'match-card-urgent' : ''} ${isCompact ? 'match-card-compact' : ''}`}>
      <div className="match-row">
        <div style={{ width: '120px', display: 'flex', alignItems: 'center', height: '40px', marginRight: '48px', position: 'relative' }}>
          {highlightTeam && (
            <Link href={`/team/${encodeURIComponent(highlightTeam)}`} className="team-focus">
              {highlightTeam}
            </Link>
          )}
        </div>

        <div className="match-meta" style={{ marginRight: '32px' }}>
          <div className="match-date">{formattedDate}</div>
          <div className="match-time">{formattedTime}</div>
        </div>

        <div className="match-teams">
          <div className="team-section team-home"><span className="team-name">{game.homeTeam}</span></div>
          <div className="match-score">{isRecent && game.homeScore !== null && game.awayScore !== null ? (<span className="score-display">{game.homeScore}-{game.awayScore}</span>) : (<span className="vs-text">vs</span>)}</div>
          <div className="team-section team-away"><span className="team-name">{game.awayTeam}</span></div>
        </div>

        {status.show && (<div className="match-status" style={{ marginLeft: '16px' }}><span className={`status-badge ${status.class}`}>{status.text}</span></div>)}

        <div className="odds-indicator" style={{ marginLeft: '16px' }}>
          <GameOddsInline game={game} />
        </div>

        {showBetting && (
          <div className="betting-section" style={{ marginLeft: '16px' }}>
            <BettingInfo
              gameId={game.id || `${game.homeTeam}-${game.awayTeam}-${game.date}`}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
              gameDate={game.date}
              gameStatus={game.status}
              gameResult={game.homeScore !== null && game.awayScore !== null ? { homeScore: game.homeScore, awayScore: game.awayScore } : null}
              bettingState={game.bettingState}
              drawOdds={typeof game.drawOdds === 'number' ? game.drawOdds : (game.customOdds?.draw ?? null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function GameOddsInline({ game }) {
  const initialOdds = (typeof game.drawOdds === 'number') ? game.drawOdds : (game.customOdds?.draw ?? null);
  const [currentOdds, setCurrentOdds] = useState(initialOdds);
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState(initialOdds === null || initialOdds === undefined ? '' : Number(initialOdds).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCurrentOdds(initialOdds);
    setInputText(initialOdds === null || initialOdds === undefined ? '' : Number(initialOdds).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [initialOdds]);

  const startEdit = () => { setEditing(true); setInputText(currentOdds === null || currentOdds === undefined ? '' : Number(currentOdds).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })); };
  const cancelEdit = () => { setEditing(false); setInputText(currentOdds === null || currentOdds === undefined ? '' : Number(currentOdds).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })); };

  const saveOdds = async () => {
    const v = inputText.replace(/\s/g, '').replace(',', '.').trim();
    let oddsValue = null;
    if (v === '') oddsValue = null;
    else {
      const n = parseFloat(v);
      if (Number.isNaN(n)) { console.error('Invalid odd'); return; }
      oddsValue = n;
      if (oddsValue < 1.01 || oddsValue > 50) { console.error('Odds out of range'); return; }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/odds/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id || `${game.homeTeam}-${game.awayTeam}-${game.date}`, homeTeam: game.homeTeam, awayTeam: game.awayTeam, date: game.date, drawOdds: oddsValue })
      });
      const j = await res.json();
      if (j.success) { setCurrentOdds(oddsValue); setEditing(false); } else { console.error('Save failed', j.error); }
    } catch (err) { console.error('Save error', err); } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ minWidth: '56px', textAlign: 'center', padding: '6px 8px', border: '1px solid var(--color-border-light)', borderRadius: '6px', background: 'var(--color-bg)', fontSize: '13px' }}>
        {currentOdds === null || currentOdds === undefined ? '—' : Number(currentOdds).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {!editing ? (
        <button onClick={startEdit} title="Editar odd" style={{ padding: '6px', borderRadius: '6px' }}>+</button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input type="text" inputMode="decimal" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveOdds(); if (e.key === 'Escape') cancelEdit(); }} placeholder="—" style={{ width: '80px', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--color-border-light)', textAlign: 'center' }} disabled={saving} />
          <button onClick={saveOdds} disabled={saving} style={{ background: 'var(--color-success)', color: '#fff', padding: '6px', borderRadius: '6px' }}>{saving ? '...' : '✓'}</button>
          <button onClick={cancelEdit} disabled={saving} style={{ background: 'var(--color-error)', color: '#fff', padding: '6px', borderRadius: '6px' }}>✕</button>
        </div>
      )}
    </div>
  );
}