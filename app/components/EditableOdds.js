"use client";

import { useState, useEffect } from 'react';

export default function EditableOdds({ gameId, homeTeam, awayTeam, date, currentOdds, onOddsUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [odds, setOdds] = useState(currentOdds);
  const [displayOdds, setDisplayOdds] = useState(currentOdds);
  const [inputText, setInputText] = useState(currentOdds === null || currentOdds === undefined ? '' : Number(currentOdds).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOdds(currentOdds);
    setDisplayOdds(currentOdds);
    setInputText(currentOdds === null || currentOdds === undefined ? '' : Number(currentOdds).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [currentOdds]);

  const handleSave = async () => {
    if (odds === currentOdds) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/odds/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          homeTeam,
          awayTeam,
          date,
          drawOdds: odds === null || odds === undefined ? null : odds
        }),
      });

      const result = await response.json();
      if (result.success) {
        setDisplayOdds(odds);
        if (odds === null || odds === undefined) {
          setInputText('');
        } else {
          setInputText(String(Number(odds).toLocaleString('pt-PT', { maximumFractionDigits: 2 })));
        }
        if (onOddsUpdate) onOddsUpdate(odds);
        setIsEditing(false);
      } else {
        console.error('Erro ao salvar odds:', result.error);
        setOdds(currentOdds);
      }
    } catch (error) {
      console.error('Erro ao salvar odds:', error);
      setOdds(currentOdds);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setOdds(currentOdds);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          type="text"
          inputMode="decimal"
          value={inputText}
          onChange={(e) => {
            const v = e.target.value;
            const allowed = v.replace(/[^0-9.,]/g, '');
            if (allowed !== v) return;
            setInputText(v);
            const normalized = v.replace(',', '.').trim();
            const fullNumberPattern = /^\d{1,2}(?:[.,]\d{1,2})?$/;
            if (v === '') {
              setOdds(null);
            } else if (fullNumberPattern.test(v)) {
              const n = parseFloat(normalized);
              setOdds(Number.isNaN(n) ? null : n);
            } else {
              // intermediate states
            }
          }}
          placeholder="—"
          style={{
            width: '60px',
            padding: '2px 6px',
            fontSize: '11px',
            border: '1px solid var(--color-accent)',
            borderRadius: '3px',
            textAlign: 'center'
          }}
          disabled={saving}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          autoFocus
          onBlur={() => {
            const v = inputText;
            const normalized = v.replace(',', '.').trim();
            if (v === '') {
              setOdds(null);
              setInputText('');
              return;
            }
            const fullNumberPattern = /^\d{1,2}(?:[.,]\d{1,2})?$/;
            if (fullNumberPattern.test(v)) {
              const n = parseFloat(normalized);
              setOdds(Number.isNaN(n) ? null : n);
              setInputText(Number.isNaN(n) ? '' : Number(n).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            } else {
              setInputText(displayOdds === null || displayOdds === undefined ? '' : Number(displayOdds).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            }
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            fontSize: '10px',
            padding: '1px 4px',
            background: 'var(--color-success)',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          {saving ? '...' : '✓'}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          style={{
            fontSize: '10px',
            padding: '1px 4px',
            background: 'var(--color-error)',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  const formatDisplay = (value) => {
    if (value === null || value === undefined) return '—';
    const num = Number(value);
    if (Number.isNaN(num)) return '—';
    return num.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <span
      style={{
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: '3px',
        transition: 'background 0.2s'
      }}
      onClick={() => setIsEditing(true)}
      onMouseEnter={(e) => e.target.style.background = 'var(--color-accent-light)'}
      onMouseLeave={(e) => e.target.style.background = 'transparent'}
      title="Click to edit odds"
    >
      {formatDisplay(displayOdds)}
    </span>
  );
}
