'use client';

import { useState } from 'react';

export default function UpdateButton() {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/update-fixtures', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        alert('Fixtures atualizadas com sucesso!');
        window.location.reload();
      } else {
        alert('Erro ao atualizar fixtures: ' + data.error);
      }
    } catch (err) {
      alert('Erro de conexão: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6">
      <button
        onClick={handleUpdate}
        disabled={isUpdating}
        className={`font-bold py-3 px-6 rounded-full shadow-lg transition-colors ${
          isUpdating
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isUpdating ? 'Atualizando...' : 'Atualizar Fixtures'}
      </button>
    </div>
  );
}