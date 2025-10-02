import connectToDatabase from '@/lib/mongodb';
import Game from '@/models/Game';

// Verifica se há dados no MongoDB
export async function checkDatabaseForGames() {
  try {
    await connectToDatabase();
    const gameCount = await Game.countDocuments();
    return gameCount > 0;
  } catch (error) {
    console.error('Erro ao verificar dados no MongoDB:', error);
    return false;
  }
}

// Busca dados da API se não houver no banco
export async function ensureDataExists() {
  try {
    const hasData = await checkDatabaseForGames();
    
    if (!hasData) {
      console.log('Nenhum dado encontrado no MongoDB. Buscando da API SportRadar...');
      
      // Chama a API para buscar dados
      const response = await fetch('/api/update-fixtures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Dados carregados com sucesso:', result);
        return true;
      } else {
        console.error('Erro ao carregar dados da API');
        return false;
      }
    }
    
    return true; // Dados já existem
  } catch (error) {
    console.error('Erro ao garantir dados existem:', error);
    return false;
  }
}