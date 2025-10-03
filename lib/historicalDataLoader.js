import connectToDatabase from './mongodb.js';
import mongoose from 'mongoose';
import { TEAMS } from './teams.js';

// URLs para as épocas passadas (2024/25) - usando mesma estrutura do dataLoader
const HISTORICAL_SEASON_URLS = {
  'La Liga': 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/118691', // La Liga 24/25
};

// Fazer teste só com La Liga primeiro
const TEST_URLS = {
  'laliga': 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/118691',
};

// Schema para dados históricos (igual ao atual mas com época)
const HistoricalTeamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    unique: false
  },
  season: {
    type: String,
    required: true // ex: "2024-25"
  },
  league: {
    type: String,
    required: true // ex: "laliga"  
  },
  games: [{
    opponent: {
      type: String,
      required: true
    },
    isHome: {
      type: Boolean,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'finished'],
      default: 'scheduled'
    },
    teamScore: {
      type: Number,
      default: null
    },
    opponentScore: {
      type: Number,
      default: null
    },
    // Campos adicionais para compatibilidade com GameCard
    homeScore: {
      type: Number,
      default: null
    },
    awayScore: {
      type: Number,
      default: null
    },
    homeTeam: {
      type: String,
      required: false
    },
    awayTeam: {
      type: String,
      required: false
    },
    sportRadarId: {
      type: String,
      required: false
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Criar índice composto para busca eficiente
HistoricalTeamSchema.index({ teamName: 1, season: 1, league: 1 }, { unique: true });

// Função para obter modelo da época específica
function getHistoricalModel(league, season) {
  const baseName = league.replace(/\s+/g, '').toLowerCase();
  const seasonSuffix = season.replace('-', '_');
  const modelName = `${baseName}_${seasonSuffix}`;
  
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  
  return mongoose.model(modelName, HistoricalTeamSchema, modelName.toLowerCase());
}

// Buscar dados históricos da SportsRadar para uma liga específica (mesma estrutura do dataLoader)
async function fetchHistoricalSeasonData(league, season = '2024-25') {
  try {
    console.log(`🔍 Buscando dados históricos: ${league} ${season}`);
    
    const url = HISTORICAL_SEASON_URLS[league];
    if (!url) {
      throw new Error(`URL não encontrada para liga: ${league}`);
    }

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    const response = await fetch(url, { 
      headers,
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
    
    // Buscar dados da SportsRadar
    const seasonData = await fetchHistoricalSeasonData(league, season);
    
    // Obter modelo para esta época
    const HistoricalModel = getHistoricalModel(league, season);
    
    // Processar dados dos jogos (mesma lógica do dataLoader.js)
    const teamsData = {};
    
    if (seasonData.doc && seasonData.doc[0] && seasonData.doc[0].data && seasonData.doc[0].data.matches) {
      const matches = seasonData.doc[0].data.matches;
      
      matches.forEach(match => {
        const homeTeam = match.teams?.home?.name;
        const awayTeam = match.teams?.away?.name;
        
        if (!homeTeam || !awayTeam) {
          return;
        }
        
        // Parse da data/hora usando mesma lógica do dataLoader
        let fixtureDate;
        if (match.time?.uts) {
          fixtureDate = new Date(match.time.uts * 1000);
        } else if (match.time?.date && match.time?.time) {
          const dateStr = `${match.time.date} ${match.time.time}`;
          fixtureDate = new Date(dateStr + ' GMT+0100');
        } else {
          fixtureDate = new Date();
        }
        
        // Status usando lógica corrigida (igual ao dataLoader atual)
        let status;
        if (match.status === 'ended') {
          status = 'finished';
        } else if (match.status === 'live') {
          status = 'live';
        } else if (match.postponed || match.canceled || match.status === 'Adiado') {
          status = 'postponed';
        } else if (match.result?.home !== null && match.result?.away !== null) {
          // Se tem resultado mas não está marcado como 'ended', deve ser 'finished'
          status = 'finished';
        } else {
          status = 'scheduled';
        }
        
        // Verificar se pelo menos uma das equipas está na nossa lista alvo
        const isTargetMatch = TEAMS.includes(homeTeam) || TEAMS.includes(awayTeam);
        
        if (!isTargetMatch) {
          return;
        }
        
        // Processar jogo para equipa da casa (apenas se for equipa alvo)
        if (TEAMS.includes(homeTeam)) {
          if (!teamsData[homeTeam]) {
            teamsData[homeTeam] = {
              teamName: homeTeam,
              league: league,
              season: season,
              games: []
            };
          }
          
          teamsData[homeTeam].games.push({
            opponent: awayTeam ?? null,
            isHome: true,
            date: fixtureDate ?? null,
            status: status ?? null,
            teamScore: match.result?.home ?? null,
            opponentScore: match.result?.away ?? null,
            homeScore: match.result?.home ?? null,
            awayScore: match.result?.away ?? null,
            homeTeam: homeTeam ?? null,
            awayTeam: awayTeam ?? null,
            sportRadarId: match._id?.toString() ?? `${homeTeam}_${awayTeam}_${fixtureDate.getTime()}`
          });
        }
        
        // Processar jogo para equipa visitante (apenas se for equipa alvo)
        if (TEAMS.includes(awayTeam)) {
          if (!teamsData[awayTeam]) {
            teamsData[awayTeam] = {
              teamName: awayTeam,
              league: league,
              season: season,
              games: []
            };
          }
          
          teamsData[awayTeam].games.push({
            opponent: homeTeam ?? null,
            isHome: false,
            date: fixtureDate ?? null,
            status: status ?? null,
            teamScore: match.result?.away ?? null,
            opponentScore: match.result?.home ?? null,
            homeScore: match.result?.home ?? null,
            awayScore: match.result?.away ?? null,
            homeTeam: homeTeam ?? null,
            awayTeam: awayTeam ?? null,
            sportRadarId: match._id?.toString() ?? `${homeTeam}_${awayTeam}_${fixtureDate.getTime()}`
          });
        }
      });
    }
    
    // Salvar no MongoDB
    let savedCount = 0;
    for (const [teamName, teamData] of Object.entries(teamsData)) {
      try {
        await HistoricalModel.findOneAndUpdate(
          { teamName: teamName, season: season, league: league },
          {
            ...teamData,
            lastUpdated: new Date()
          },
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
    
    // Determinar liga da equipa
    // Map lowercase keys to display names as stored in DB
    const leagueKeyToName = {
      'laliga': 'La Liga',
      'premierleague': 'Premier League',
      'ligue1': 'Ligue 1'
    };
    const leagues = ['laliga', 'premierleague', 'ligue1'];
    
    for (const leagueKey of leagues) {
      const leagueName = leagueKeyToName[leagueKey];
      const HistoricalModel = getHistoricalModel(leagueKey, season);
      const teamData = await HistoricalModel.findOne({ 
        teamName: teamName, 
        season: season, 
        league: leagueName 
      }).lean();
      
      if (teamData) {
        // Converter dados históricos para formato compatível com GameCard
        const convertedGames = teamData.games.map(game => ({
          ...game,
          homeTeam: game.isHome ? teamName : game.opponent,
          awayTeam: game.isHome ? game.opponent : teamName,
          homeScore: game.isHome ? game.teamScore : game.opponentScore,
          awayScore: game.isHome ? game.opponentScore : game.teamScore,
          // Manter campos originais para compatibilidade
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