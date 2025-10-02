'use client';

import { useEffect, useState } from 'react';

export default function AutoDataLoader() {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Verificando dados...');

  useEffect(() => {
    checkAndLoadData();
  }, []);

  const checkAndLoadData = async () => {
    try {
      setStatus('checking');
      setMessage('Verificando se há dados no banco...');

      const response = await fetch('/api/check-data');
      const data = await response.json();

      if (data.hasData) {
        setStatus('ready');
        setMessage('Dados disponíveis no banco');
        return;
      }

      // Se não há dados, carrega automaticamente
      setStatus('loading');
      setMessage('Carregando dados da API SportRadar...');

      const updateResponse = await fetch('/api/update-fixtures', {
        method: 'POST'
      });

      const updateData = await updateResponse.json();

      if (updateData.success) {
        setStatus('success');
        setMessage(`Dados carregados com sucesso! ${updateData.stats?.totalUpdated || 0} jogos adicionados.`);
        
        // Recarrega a página após 3 segundos
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setStatus('error');
        setMessage('Erro ao carregar dados: ' + updateData.error);
      }

    } catch (error) {
      setStatus('error');
      setMessage('Erro de conexão: ' + error.message);
    }
  };

  if (status === 'ready') {
    return null; // Não mostra nada se os dados já existem
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`p-4 rounded-lg shadow-lg max-w-sm ${
        status === 'error' ? 'bg-red-50 border border-red-200' :
        status === 'success' ? 'bg-green-50 border border-green-200' :
        'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-center space-x-3">
          {status === 'loading' || status === 'checking' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          ) : status === 'success' ? (
            <div className="h-5 w-5 text-green-600">✓</div>
          ) : (
            <div className="h-5 w-5 text-red-600">✗</div>
          )}
          
          <div>
            <p className={`text-sm font-medium ${
              status === 'error' ? 'text-red-800' :
              status === 'success' ? 'text-green-800' :
              'text-blue-800'
            }`}>
              {status === 'checking' ? 'Verificando dados' :
               status === 'loading' ? 'Carregando' :
               status === 'success' ? 'Sucesso!' : 'Erro'}
            </p>
            <p className={`text-xs ${
              status === 'error' ? 'text-red-600' :
              status === 'success' ? 'text-green-600' :
              'text-blue-600'
            }`}>
              {message}
            </p>
          </div>
        </div>

        {status === 'error' && (
          <button
            onClick={checkAndLoadData}
            className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
          >
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  );
}