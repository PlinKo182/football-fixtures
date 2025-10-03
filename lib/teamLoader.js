import connectToDatabase from './mongodb.js';
import { getLeagueModel } from '../models/Team.js';
import { getLeagueByTeam } from './teams.js';

// Buscar jogos de uma equipa específica (muito mais rápido)
export async function getTeamGamesOptimized(teamName) {
  try {
    await connectToDatabase();
    
    // Descobrir a liga da equipa
    const leagueName = getLeagueByTeam(teamName);
    if (!leagueName) {
      return null;
    }
    
    // Buscar apenas esta equipa desta liga
    const LeagueModel = getLeagueModel(leagueName);
    const teamData = await LeagueModel.findOne({ teamName }).lean();
    
    if (!teamData) {
      return null;
    }
    
    return {
      teamName: teamData.teamName,
      league: leagueName,
      games: teamData.games.sort((a, b) => new Date(b.date) - new Date(a.date)),
      lastUpdated: teamData.lastUpdated
    };
  } catch (error) {
    console.error('Erro ao buscar jogos da equipa:', error);
    return null;
  }
}