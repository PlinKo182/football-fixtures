import connectToDatabase from './mongodb.js';
import mongoose from 'mongoose';
import { TEAMS } from './teams.js';

// URLs para as épocas passadas (2024/25) - usando mesmas keys usadas no código
const HISTORICAL_SEASON_URLS = {
  'laliga': 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/118691',
  'premierleague': 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/118689',
  'ligue1': 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/119835'
};

// Schema para dados históricos (igual ao atual mas com época)
const HistoricalTeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  season: { type: String, required: true },
  league: { type: String, required: true },
  games: [{
    opponent: { type: String, required: true },
    isHome: { type: Boolean, required: true },
    date: { type: Date, required: true },
    time: { type: String },
    status: { type: String, enum: ['scheduled', 'live', 'finished', 'postponed'], default: 'scheduled' },
    teamScore: { type: Number, default: null },
    opponentScore: { type: Number, default: null },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    homeTeam: { type: String },
    awayTeam: { type: String },
    sportRadarId: { type: String }
  }],
  lastUpdated: { type: Date, default: Date.now }
});

// Índice composto para busca eficiente
HistoricalTeamSchema.index({ teamName: 1, season: 1, league: 1 }, { unique: true });

// Função para obter modelo da época específica
function getHistoricalModel(league, season) {
  const modelName = `${league}_${season.replace('-', '_')}`;
  if (mongoose.models[modelName]) return mongoose.models[modelName];
  return mongoose.model(modelName, HistoricalTeamSchema, modelName.toLowerCase());
}

// Buscar dados históricos da SportsRadar
async function fetchHistoricalSeasonData(league, season = '2024-25') {
  try {
    console.log(`🔍 Buscando dados históricos: ${league} ${season}`);
    
    const url = HISTORICAL_SEASON_URLS[league];
    if (!url) throw new Error(`URL não encontrada para liga: ${league}`);

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    const response = await fetch(url, { 
      headers,
      signal: AbortSignal.timeout(30000) // timeout aumentado
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log(`✅ Dados históricos obtidos: ${league} ${season}`);
    return data;
  } catch (error) {
    console.error(`❌ Erro ao buscar dados históricos ${league}:`, error);
    throw error;
  }
}

// Processar e salvar dados históricos no MongoDB
async function saveHistoricalData(league, season = '2024-25') {
  try {
    await connectToDatabase();
    console.log(`📊 Processando dados históricos: ${league} ${season}`);

    const seasonData = await fetchHistoricalSeasonData(league, season);
    const HistoricalModel = getHistoricalModel(league, season);
    const teamsData = {};

    if (seasonData.doc?.[0]?.data?.matches) {
      const matches = seasonData.doc[0].data.matches;

      matches.forEach(match => {
        const homeTeam = match.teams?.home?.name;
        const awayTeam = match.teams?.away?.name;
        if (!homeTeam || !awayTeam) return;

        // Parse data/hora
        let fixtureDate;
        if (match.time?.uts) fixtureDate = new Date(match.time.uts * 1000);
        else if (match.time?.date && match.time?.time) fixtureDate = new Date(`${match.time.date} ${match.time.time} GMT+0100`);
        else fixtureDate = new Date();

        // Status
        let status;
        if (match.status === 'ended' || (match.result?.home != null && match.result?.away != null)) status = 'finished';
        else if (match.status === 'live') status = 'live';
        else if (match.postponed || match.canceled || match.status === 'Adiado') status = 'postponed';
        else status = 'scheduled';

        // Apenas equipas na lista TEAMS
        if (!TEAMS.includes(homeTeam) && !TEAMS.includes(awayTeam)) return;

        const processTeam = (team, opponent, isHome) => {
          if (!TEAMS.includes(team)) return;
          if (!teamsData[team]) teamsData[team] = { teamName: team, league, season, games: [] };

          teamsData[team].games.push({
            opponent: opponent,
            isHome,
            date: fixtureDate,
            status,
            teamScore: isHome ? match.result?.home ?? null : match.result?.away ?? null,
            opponentScore: isHome ? match.result?.away ?? null : match.result?.home ?? null,
            homeScore: match.result?.home ?? null,
            awayScore: match.result?.away ?? null,
            homeTeam,
            awayTeam,
            sportRadarId: match._id?.toString() ?? `${homeTeam}_${awayTeam}_${fixtureDate.getTime()}`
          });
        };

        processTeam(homeTeam, awayTeam, true);
        processTeam(awayTeam, homeTeam, false);
      });
    }

    // Salvar no MongoDB
    let savedCount = 0;
    for (const [teamName, teamData] of Object.entries(teamsData)) {
      try {
        await HistoricalModel.findOneAndUpdate(
          { teamName, season, league },
          { ...teamData, lastUpdated: new Date() },
          { upsert: true, new: true }
        );
        savedCount++;
      } catch (error) {
        console.error(`❌ Erro ao salvar ${teamName}:`, error);
      }
    }

    console.log(`✅ Dados históricos salvos: ${savedCount} equipas da ${league} ${season}`);
    return { league, season, savedCount, totalTeams: Object.keys(teamsData).length };

  } catch (error) {
    console.error(`❌ Erro ao processar dados históricos ${league} ${season}:`, error);
    throw error;
  }
}

// Buscar dados históricos de uma equipa específica
export async function getTeamHistoricalGames(teamName, season = '2024-25') {
  try {
    await connectToDatabase();
    const leagues = ['laliga', 'premierleague', 'ligue1'];

    for (const league of leagues) {
      const HistoricalModel = getHistoricalModel(league, season);
      const teamData = await HistoricalModel.findOne({ teamName, season, league }).lean();
      if (teamData) {
        const convertedGames = teamData.games.map(game => ({
          ...game,
          homeTeam: game.isHome ? teamName : game.opponent,
          awayTeam: game.isHome ? game.opponent : teamName,
          homeScore: game.isHome ? game.teamScore : game.opponentScore,
          awayScore: game.isHome ? game.opponentScore : game.teamScore,
          teamScore: game.teamScore,
          opponentScore: game.opponentScore
        }));
        return {
          teamName: teamData.teamName,
          league: teamData.league,
          season: teamData.season,
          games: convertedGames.sort((a, b) => new Date(b.date) - new Date(a.date)),
          lastUpdated: teamData.lastUpdated
        };
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar dados históricos da equipa:', error);
    return null;
  }
}

// Função principal para importar todas as épocas históricas
export async function importAllHistoricalData(season = '2024-25') {
  try {
    console.log(`🚀 Iniciando importação de dados históricos da época ${season}`);
    const results = [];

    for (const league of Object.keys(HISTORICAL_SEASON_URLS)) {
      try {
        const result = await saveHistoricalData(league, season);
        results.push(result);
        console.log(`✅ ${league} completa: ${result.savedCount} equipas`);
      } catch (error) {
        console.error(`❌ Falha na ${league}:`, error.message);
        results.push({ league, season, error: error.message });
      }
    }

    console.log(`🎉 Importação completa da época ${season}:`, results);
    return results;

  } catch (error) {
    console.error('❌ Erro na importação histórica:', error);
    throw error;
  }
}

export { saveHistoricalData, fetchHistoricalSeasonData, getHistoricalModel };
