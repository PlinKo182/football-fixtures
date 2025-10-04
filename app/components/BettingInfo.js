"use client";

import { useState, useEffect } from 'react';
import { formatCurrency, getSequenceStatusColor } from '@/hooks/useBettingSequences';
// EditableOdds removed from quick actions to simplify UI

export default function BettingInfo({ 
  gameId, 
  homeTeam, 
  awayTeam, 
  gameDate, 
  gameStatus,
  gameResult = null,
  compact = false,
  bettingState: providedBettingState = null 
  , drawOdds = null
}) {
  const [showActions, setShowActions] = useState(false);
  const [odds, setOdds] = useState(3.0);
  const [loading, setLoading] = useState(true);
  const [bettingState, setBettingState] = useState(null);
  
  // For now, let's focus on home team betting
  const relevantTeam = homeTeam;
  
  // Load betting state - use provided state if available, otherwise fetch
  useEffect(() => {
    async function loadBettingState() {
      try {
        setLoading(true);
        
        // Use provided betting state if available
        if (providedBettingState) {
          setBettingState({
            teamName: relevantTeam,
            currentSequence: providedBettingState.sequence,
            nextBetAmount: providedBettingState.nextBet,
            sequenceInvested: 0.00, // We'll calculate this if needed  
            potentialProfit: providedBettingState.nextBet * 2.0, // Simplified for now
            totalProfit: providedBettingState.totalProfit,
            status: providedBettingState.sequence === 1 ? 'fresh' : 'active'
          });
          setLoading(false);
          return;
        }

        // Fallback to API call
        const response = await fetch(`/api/betting/calculate?team=${encodeURIComponent(relevantTeam)}`);
        const data = await response.json();
        
        if (data.success) {
          setBettingState(data.bettingState);
        } else {
          console.error('Error loading betting state:', data.error);
          // Fallback to default state
          setBettingState({
            teamName: relevantTeam,
            currentSequence: 1,
            nextBetAmount: 0.10,
            sequenceInvested: 0.00,
            potentialProfit: 0.20,
            status: 'new'
          });
        }
      } catch (error) {
        console.error('Error fetching betting state:', error);
        // Fallback to default state
        setBettingState({
          teamName: relevantTeam,
          currentSequence: 1,
          nextBetAmount: 0.10,
          sequenceInvested: 0.00,
          potentialProfit: 0.20,
          status: 'error'
        });  
      } finally {
        setLoading(false);
      }
    }
    
    if (relevantTeam) {
      loadBettingState();
    }
  }, [relevantTeam, providedBettingState]);
  
  // For now, these are placeholder functions
  const handlePlaceBet = async () => {
    if (bettingState) {
      console.log(`Would place bet of €${bettingState.nextBetAmount} on ${relevantTeam}`);
    }
    setShowActions(false);
  };

  const handleResult = async (result) => {
    console.log(`Would record result "${result}" for ${relevantTeam}`);
    setShowActions(false);
  };
  
  // Show loading state
  if (loading || !bettingState) {
    return (
      <div className="betting-info">
        <div className="betting-indicator" style={{ padding: '4px 8px', minWidth: '80px' }}>
          <div style={{ fontSize: '10px', color: '#666' }}>Loading...</div>
        </div>
      </div>
    );
  }

  const sequenceColor = getSequenceStatusColor(bettingState.currentSequence);
  
  // Compact mode rendering
  if (compact) {
    return (
      <div className="betting-info">
        <div className="betting-indicator" style={{ borderLeftColor: sequenceColor, minWidth: '60px', padding: '2px 6px' }}>
          <div className="betting-sequence">
            <span className="sequence-number" style={{ fontSize: '9px' }}>#{bettingState.currentSequence}</span>
            <span className="bet-amount" style={{ fontSize: '10px' }}>{formatCurrency(bettingState.nextBetAmount)}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="betting-info">
      {/* Betting indicator */}
      <div className="betting-indicator" style={{ borderLeftColor: sequenceColor }}>
        <div className="betting-sequence">
          <span className="sequence-number">#{bettingState.currentSequence}</span>
          <span className="bet-amount">{formatCurrency(bettingState.nextBetAmount)}</span>
        </div>
        
        <div className="betting-stats">
          <span className="invested">-{formatCurrency(bettingState.sequenceInvested || 0)}</span>
          <span className="potential">+{formatCurrency(bettingState.potentialProfit || 0.20)}</span>
        </div>
      </div>
      
      {/* Quick actions removed to simplify UI (placed odds editing on match card) */}
    </div>
  );
}