'use client';

import { useState, useEffect, useCallback } from 'react';

export function useBettingSequences() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all betting sequences
  const fetchSequences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/betting/sequences');
      const data = await response.json();
      
      if (data.success) {
        setSequences(data.sequences);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update betting sequence
  const updateSequence = useCallback(async (teamName, action, gameResult = null, odds = null) => {
    try {
      const response = await fetch('/api/betting/sequences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName,
          action,
          gameResult,
          odds
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setSequences(prev => {
          const index = prev.findIndex(seq => seq.teamName === teamName);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.sequence;
            return updated;
          } else {
            return [...prev, data.sequence];
          }
        });
        return data.sequence;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Place bet for team
  const placeBet = useCallback(async (teamName, odds = 3.0) => {
    return updateSequence(teamName, 'bet', null, odds);
  }, [updateSequence]);

  // Record game result
  const recordResult = useCallback(async (teamName, result) => {
    return updateSequence(teamName, 'result', result);
  }, [updateSequence]);

  // Reset sequence
  const resetSequence = useCallback(async (teamName) => {
    return updateSequence(teamName, 'reset');
  }, [updateSequence]);

  // Update odds
  const updateOdds = useCallback(async (teamName, odds) => {
    return updateSequence(teamName, 'update', null, odds);
  }, [updateSequence]);

  // Get sequence for specific team
  const getSequenceForTeam = useCallback((teamName) => {
    return sequences.find(seq => seq.teamName === teamName);
  }, [sequences]);

  // Calculate total profit across all sequences
  const getTotalProfit = useCallback(() => {
    return sequences.reduce((total, seq) => total + (seq.profit || 0), 0);
  }, [sequences]);

  // Calculate total invested across all active sequences
  const getTotalInvested = useCallback(() => {
    return sequences.reduce((total, seq) => total + (seq.totalInvested || 0), 0);
  }, [sequences]);

  // Get sequences that need attention (high sequence numbers)
  const getHighRiskSequences = useCallback(() => {
    return sequences.filter(seq => seq.currentSequence >= 10);
  }, [sequences]);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  return {
    sequences,
    loading,
    error,
    fetchSequences,
    placeBet,
    recordResult,
    resetSequence,
    updateOdds,
    getSequenceForTeam,
    getTotalProfit,
    getTotalInvested,
    getHighRiskSequences,
    refresh: fetchSequences
  };
}

// Helper function to format currency
export function formatCurrency(amount, currency = '€') {
  return `${amount.toFixed(2)}${currency}`;
}

// Helper function to get sequence status color
export function getSequenceStatusColor(sequence) {
  if (sequence >= 15) return '#ef4444'; // red
  if (sequence >= 10) return '#f59e0b'; // amber
  if (sequence >= 5) return '#3b82f6';  // blue
  return '#10b981'; // green
}

// Helper function to get next bet info
export function getNextBetInfo(currentSequence) {
  const progression = [
    0.10, 0.18, 0.32, 0.57, 1.02, 1.78, 3.11, 5.43, 9.47, 16.52,
    28.08, 47.32, 79.74, 131.57, 217.09, 358.19, 573.11, 879.72, 1332.77, 2000.00
  ];
  
  const index = Math.min(currentSequence - 1, progression.length - 1);
  return {
    amount: progression[index],
    sequence: currentSequence,
    isMaxReached: currentSequence >= 20
  };
}