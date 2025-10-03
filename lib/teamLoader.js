import connectToDatabase from './mongodb.js';
import { getLeagueModelCurrent } from '../models/Team.js';
import { getLeagueByTeam } from './teams.js';
import { getTeamHistoricalGames } from './historicalDataLoader.js';

// Buscar jogos de uma equipa específica (muito mais rápido)
export async function getTeamGamesOptimized(teamName) {
  try {
    console.log('🔍 Buscando jogos para:', teamName);
    await connectToDatabase();
    
    // Descobrir a liga da equipa
    const leagueName = getLeagueByTeam(teamName);
    console.log('📊 Liga encontrada:', leagueName);
    
    if (!leagueName) {
      console.log('❌ Liga não encontrada para:', teamName);
      return null;
    }
    
    // Buscar apenas esta equipa desta liga (época atual)
    const LeagueModel = getLeagueModelCurrent(leagueName);
    console.log('🏆 Modelo da liga obtido:', LeagueModel.modelName);
    
    const teamData = await LeagueModel.findOne({ teamName }).lean();
    console.log('⚽ Dados da equipa encontrados:', teamData ? 'Sim' : 'Não');
    
    if (!teamData) {
      console.log('❌ Dados da equipa não encontrados na base de dados');
      return null;
    }
    
    const result = {
      teamName: teamData.teamName,
      league: leagueName,
      games: teamData.games ? teamData.games.sort((a, b) => new Date(b.date) - new Date(a.date)) : [],
      lastUpdated: teamData.lastUpdated
    };
    
    console.log('✅ Resultado final:', {
      teamName: result.teamName,
      league: result.league,
      gamesCount: result.games.length
    });
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao buscar jogos da equipa:', error);
    console.error('Stack trace:', error.stack);
    return null;
  }
}

// Buscar jogos atuais + históricos de uma equipa
export async function getTeamGamesWithHistory(teamName, includeHistorical = true) {
  try {
    console.log('🔍 Buscando jogos completos para:', teamName);
    
    // Buscar dados atuais (época 2025-26)
    const currentData = await getTeamGamesOptimized(teamName);
    
    if (!includeHistorical || !currentData) {
      return currentData;
    }
    
    // Buscar dados históricos (época 2024-25)
    const historicalData = await getTeamHistoricalGames(teamName, '2024-25');
    
    if (!historicalData) {
      console.log('📊 Sem dados históricos, retornando apenas época atual');
      return currentData;
    }
    
    // Combinar dados atuais + históricos
    const combinedGames = [
      ...currentData.games.map(game => ({ ...game, season: '2025-26' })),
      ...historicalData.games.map(game => ({ ...game, season: '2024-25' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const result = {
      teamName: currentData.teamName,
      league: currentData.league,
      games: combinedGames,
      seasons: ['2025-26', '2024-25'],
      lastUpdated: currentData.lastUpdated,
      historicalLastUpdated: historicalData.lastUpdated
    };
    
    console.log('✅ Dados completos:', {
      teamName: result.teamName,
      totalGames: result.games.length,
      currentSeasonGames: currentData.games.length,
      historicalGames: historicalData.games.length
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro ao buscar jogos completos:', error);
    return await getTeamGamesOptimized(teamName); // Fallback para dados atuais apenas
  }
}