"use client";

import { useState } from 'react';

export default function BettingToggle({ onToggle, showBetting }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(!showBetting)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            showBetting ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              showBetting ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mostrar Sistema de Apostas
        </label>
      </div>
      
      {showBetting && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Sistema Martingale ativo • Apostas em empates • Odds padrão: 3.0
          </p>
        </div>
      )}
    </div>
  );
}
