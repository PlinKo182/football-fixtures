import { useState } from 'react';

export default function SeasonToggle({ currentGames, historicalGames, onSeasonChange }) {
  const [selectedSeason, setSelectedSeason] = useState('all');
  
  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    onSeasonChange(season);
  };
  
  const seasons = [
    { id: 'all', name: 'Todas as Épocas', count: currentGames.length + (historicalGames?.length || 0) },
    { id: '2025-26', name: '2025/26 (Atual)', count: currentGames.length },
    ...(historicalGames?.length > 0 ? [{ id: '2024-25', name: '2024/25', count: historicalGames.length }] : [])
  ];
  
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {seasons.map((season) => (
        <button
          key={season.id}
          onClick={() => handleSeasonChange(season.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            selectedSeason === season.id
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          <span>{season.name}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            selectedSeason === season.id
              ? 'bg-white/20 text-white'
              : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-400'
          }`}>
            {season.count}
          </span>
        </button>
      ))}
    </div>
  );
}
