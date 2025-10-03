'use client';

import { useState } from 'react';

export default function ImportHistoricalButton() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  
  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const response = await fetch('/api/import-historical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ season: '2024-25' })
      });
      
      const result = await response.json();
      setImportResult(result);
      
      if (result.success) {
        // Recarregar a página após importação bem-sucedida
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      setImportResult({
        success: false,
        message: 'Erro de rede ao importar dados históricos'
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-800 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
            Dados Históricos - Época 2024/25
          </h3>
          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
            Importar dados da época passada para análise completa das equipas
          </p>
          
          {importResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              importResult.success 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
            }`}>
              <p className="font-medium">
                {importResult.success ? '✅ Sucesso!' : '❌ Erro!'}
              </p>
              <p>{importResult.message}</p>
              {importResult.results && Array.isArray(importResult.results) && (
                <div className="mt-2 space-y-1">
                  {importResult.results.map((result, index) => (
                    <div key={index} className="text-xs">
                      • {result.league}: {result.savedCount || 0} equipas
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={handleImport}
            disabled={isImporting}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              isImporting
                ? 'bg-orange-300 dark:bg-orange-700 text-orange-600 dark:text-orange-300 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isImporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Importando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Importar 2024/25</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}