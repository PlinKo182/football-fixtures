'use client';

import { useState } from 'react';
import GameCard from '@/app/components/GameCard';

export default function BettingTestPage() {
  const [showBetting, setShowBetting] = useState(true);
  
  // Sample games for testing
  const sampleGames = [
    {
      _id: 'test-1',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: 'scheduled',
      homeScore: null,
      awayScore: null,
      season: '2024-25'
    },
    {
      _id: 'test-2',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      status: 'scheduled',
      homeScore: null,
      awayScore: null,
      season: '2024-25'
    },
    {
      _id: 'test-3',
      homeTeam: 'Manchester City',
      awayTeam: 'Tottenham',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      status: 'finished',
      homeScore: 2,
      awayScore: 2,
      season: '2024-25'
    },
    {
      _id: 'test-4',
      homeTeam: 'Brighton',
      awayTeam: 'Newcastle',
      date: new Date().toISOString(), // Now
      status: 'live',
      homeScore: 1,
      awayScore: 0,
      season: '2024-25'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Betting System Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This page demonstrates the Martingale betting system integration with the football fixtures.
          </p>
          
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setShowBetting(!showBetting)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showBetting 
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {showBetting ? 'Hide' : 'Show'} Betting Info
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              How the Martingale System Works:
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Start with €0.10 bet on a draw outcome (3.0 odds)</li>
              <li>• If you lose, double the bet and move to next sequence</li>
              <li>• If you win (draw), you profit €0.20 and reset to sequence #1</li>
              <li>• Maximum sequence is #20 (€2000 bet)</li>
              <li>• Each sequence aims to recover all losses + €0.20 profit</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Games
          </h2>
          
          {sampleGames.map((game, index) => (
            <div key={game._id} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <GameCard 
                game={game}
                showBetting={showBetting} 
              />
            </div>
          ))}
        </div>

        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Testing Instructions:
          </h3>
          <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>1. Click the ⚡ button next to any future game to start betting</li>
            <li>2. Adjust odds if needed (default is 3.0 for draws)</li>
            <li>3. Click &quot;Bet&quot; to place the bet and advance the sequence</li>
            <li>4. Use &quot;Draw&quot; or &quot;Loss&quot; buttons to record game results</li>
            <li>5. Watch how the sequence progresses with each loss</li>
            <li>6. See how a draw resets the sequence and records profit</li>
          </ol>
        </div>
      </div>
    </div>
  );
}