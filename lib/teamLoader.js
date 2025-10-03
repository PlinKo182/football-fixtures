import connectToDatabase from './mongodb.js';
import { getLeagueModel } from '../models/Team.js';
import { getLeagueByTeam } from './teams.js';

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
    
    // Buscar apenas esta equipa desta liga
    const LeagueModel = getLeagueModel(leagueName);
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