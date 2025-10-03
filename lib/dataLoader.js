import connectToDatabase from './mongodb.js';
import { getLeagueModel } from '../models/Team.js';
import { TEAMS, LEAGUE_MAPPINGS } from './teams.js';

const BASE_URL = "https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/";

// Verifica se há dados no MongoDB
export async function checkDatabaseForGames() {
  try {
    await connectToDatabase();
    
    // Verificar se existe pelo menos uma equipa em qualquer liga
    for (const [leagueName] of Object.entries(LEAGUE_MAPPINGS)) {
      const LeagueModel = getLeagueModel(leagueName);
      const teamCount = await LeagueModel.countDocuments();
      if (teamCount > 0) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar dados no MongoDB:', error);
    return false;
  }
}

// Verifica se os dados precisam ser atualizados (mais de 2 horas antigas)
async function shouldUpdateData() {
  try {
    await connectToDatabase();
    
    for (const [leagueName] of Object.entries(LEAGUE_MAPPINGS)) {
      const LeagueModel = getLeagueModel(leagueName);
      const recentTeam = await LeagueModel.findOne({}, {}, { sort: { lastUpdated: -1 } });
      
      if (recentTeam && recentTeam.lastUpdated) {
        const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));
        if (recentTeam.lastUpdated < twoHoursAgo) {
          console.log(`📅 Dados de ${leagueName} têm mais de 2 horas (${recentTeam.lastUpdated})`);
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar idade dos dados:', error);
    return false;
  }
}

async function fetchFixturesFromAPI(leagueEndpoint) {
  try {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    const url = `${BASE_URL}${leagueEndpoint}`;
    if (process.env.DEBUG) {
      console.log(`🌐 Fazendo request para: ${url}`);
    }

    const response = await fetch(url, { 
      headers,
      signal: AbortSignal.timeout(15000)
    });
    
    if (process.env.DEBUG) {
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      console.error(`❌ HTTP error! status: ${response.status} para ${leagueEndpoint}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (process.env.DEBUG) {
      console.log(`📊 Dados recebidos, estrutura:`, Object.keys(data));
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Erro ao buscar fixtures da API (${leagueEndpoint}):`, error.message);
    throw error;
  }
}

function isTeamRelevant(homeTeam, awayTeam) {
  return TEAMS.some(team => 
    homeTeam.toLowerCase().includes(team.toLowerCase()) ||
    awayTeam.toLowerCase().includes(team.toLowerCase())
  );
}

function parseMatchForTeam(match, teamName, leagueName) {
  const homeTeam = match.teams?.home?.name;
  const awayTeam = match.teams?.away?.name;
  
  if (!homeTeam || !awayTeam) {
    return null;
  }

  // DEBUG: Log para encontrar nomes com Betis e mostrar todos os nomes da La Liga
  if (process.env.DEBUG && leagueName === 'La Liga') {
    if (!global.laLigaTeams) global.laLigaTeams = new Set();
    global.laLigaTeams.add(homeTeam);
    global.laLigaTeams.add(awayTeam);
    
    if (homeTeam.toLowerCase().includes('betis') || awayTeam.toLowerCase().includes('betis')) {
      console.log(`🔍 BETIS ENCONTRADO: "${homeTeam}" vs "${awayTeam}"`);
      console.log(`   - mediumnames: "${match.teams?.home?.mediumname}" vs "${match.teams?.away?.mediumname}"`);
    }
  }

  // Verificar se o jogo envolve a equipa especificada
  const isHome = homeTeam === teamName;
  const isAway = awayTeam === teamName;
  
  if (!isHome && !isAway) {
    return null;
  }

  // Parse da data/hora - usar o campo time.uts (Unix timestamp)
  let fixtureDate;
  if (match.time?.uts) {
    fixtureDate = new Date(match.time.uts * 1000);
  } else if (match.time?.date && match.time?.time) {
    // Assumir que as datas da API são em fuso horário de Lisboa/Madrid (UTC+1/+2)
    const dateStr = `${match.time.date} ${match.time.time}`;
    fixtureDate = new Date(dateStr + ' GMT+0100'); // Adicionar fuso horário explícito
  } else {
    fixtureDate = new Date();
  }
  
  // Determinar o adversário e os resultados
  const opponent = isHome ? awayTeam : homeTeam;
  const teamScore = isHome ? match.result?.home : match.result?.away;
  const opponentScore = isHome ? match.result?.away : match.result?.home;
  
  return {
    opponent,
    isHome,
    date: fixtureDate,
    status: match.status === 'ended' ? 'finished' : 
            match.status === 'live' ? 'live' : 
            match.postponed || match.canceled || match.status === 'Adiado' ? 'postponed' : 'scheduled',
    teamScore,
    opponentScore,
    sportRadarId: match._id?.toString()
  };
}

// Busca dados diretamente do SportsRadar se não houver no banco
export async function ensureDataExists() {
  try {
    const hasData = await checkDatabaseForGames();
    const shouldUpdate = !hasData || await shouldUpdateData();
    
    if (shouldUpdate) {
      console.log(hasData ? 
        '🔄 Dados desatualizados. Atualizando da API SportRadar...' : 
        '📥 Nenhum dado encontrado. Buscando da API SportRadar...');
      
      await connectToDatabase();
      let totalUpdated = 0;
      let totalErrors = 0;

      // Primeiro, limpar equipas que já não estão na configuração
      for (const [leagueName] of Object.entries(LEAGUE_MAPPINGS)) {
        const LeagueModel = getLeagueModel(leagueName);
        const configuredTeams = LEAGUE_MAPPINGS[leagueName].teams;
        
        const result = await LeagueModel.deleteMany({
          teamName: { $nin: configuredTeams }
        });
        
        if (result.deletedCount > 0) {
          console.log(`🗑️  ${leagueName}: Removidas ${result.deletedCount} equipas não configuradas`);
        }
      }

      // Processa cada liga
      for (const [leagueName, leagueData] of Object.entries(LEAGUE_MAPPINGS)) {
        try {
          console.log(`Buscando fixtures para ${leagueName}...`);
          
          const data = await fetchFixturesFromAPI(leagueData.endpoint);
          
          if (!data) {
            console.log(`❌ ${leagueName}: Nenhum dado retornado da API`);
            continue;
          }
          
          if (data && data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches) {
            const matches = data.doc[0].data.matches;
            console.log(`   Encontradas ${matches.length} matches para ${leagueName}`);
            
            // DEBUG: Listar todas as equipas encontradas
            if (process.env.DEBUG && leagueName === 'La Liga') {
              const allTeams = new Set();
              matches.forEach(match => {
                if (match.teams?.home?.name) allTeams.add(match.teams.home.name);
                if (match.teams?.away?.name) allTeams.add(match.teams.away.name);
              });
              console.log(`🔍 TODAS AS EQUIPAS ENCONTRADAS NA ${leagueName}:`);
              [...allTeams].sort().forEach(team => {
                console.log(`   - "${team}"`);
              });
            }
            
            const LeagueModel = getLeagueModel(leagueName);
            const relevantTeams = leagueData.teams;
            
            // Processar cada equipa relevante
            for (const teamName of relevantTeams) {
              try {
                const teamGames = [];
                
                // Encontrar todos os jogos desta equipa
                for (const match of matches) {
                  const gameData = parseMatchForTeam(match, teamName, leagueName);
                  if (gameData) {
                    teamGames.push(gameData);
                  }
                }
                
                if (teamGames.length > 0) {
                  // Atualizar ou criar o documento da equipa
                  await LeagueModel.findOneAndUpdate(
                    { teamName },
                    { 
                      teamName,
                      league: leagueName,
                      games: teamGames,
                      lastUpdated: new Date()
                    },
                    { upsert: true, new: true }
                  );
                  
                  console.log(`   ✅ ${teamName}: ${teamGames.length} jogos`);
                  totalUpdated += teamGames.length;
                }
              } catch (error) {
                console.error(`Erro ao salvar dados de ${teamName}:`, error);
                totalErrors++;
              }
            }
          }
          
          // Aguarda 1 segundo entre requests para respeitar rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Erro ao processar ${leagueName}:`, error.message);
          totalErrors++;
        }
      }

      // DEBUG: Mostrar todas as equipas da La Liga encontradas
      if (process.env.DEBUG && global.laLigaTeams) {
        console.log('\n📋 Todas as equipas da La Liga encontradas na API:');
        [...global.laLigaTeams].sort().forEach(team => {
          console.log(`   - "${team}"`);
        });
      }

      console.log(`Dados carregados com sucesso! ${totalUpdated} jogos adicionados.`);
      return totalUpdated > 0;
    }
    
    return true; // Dados já existem
  } catch (error) {
    console.error('Erro ao garantir dados existem:', error);
    return false;
  }
}

// Função para buscar todos os jogos organizados por liga e equipa
export async function getAllGames() {
  console.log('🔍 getAllGames INICIADO');
  try {
    console.log('🔌 Conectando à base de dados...');
    await connectToDatabase();
    console.log('✅ Conectado à base de dados');
    
    const allGames = {};
    console.log('📋 Processando ligas...');
    
    for (const [leagueName] of Object.entries(LEAGUE_MAPPINGS)) {
      console.log(`🏆 Processando liga: ${leagueName}`);
      const LeagueModel = getLeagueModel(leagueName);
      console.log(`🔍 Buscando equipas para ${leagueName}...`);
      const teams = await LeagueModel.find({}).lean();
      console.log(`✅ Encontradas ${teams.length} equipas para ${leagueName}`);
      
      allGames[leagueName] = teams.map(team => ({
        teamName: team.teamName,
        league: team.league || leagueName, // Garantir que league está presente
        games: team.games.sort((a, b) => new Date(a.date) - new Date(b.date)),
        lastUpdated: team.lastUpdated
      }));
    }
    
    console.log('🎯 getAllGames CONCLUÍDO com sucesso');
    return allGames;
  } catch (error) {
    console.error('❌ Erro ao buscar jogos:', error);
    return {};
  }
}

// Função para buscar jogos de uma equipa específica
export async function getTeamGames(leagueName, teamName) {
  try {
    await connectToDatabase();
    const LeagueModel = getLeagueModel(leagueName);
    
    const team = await LeagueModel.findOne({ teamName }).lean();
    if (!team) {
      return null;
    }
    
    return {
      teamName: team.teamName,
      league: team.league,
      games: team.games.sort((a, b) => new Date(a.date) - new Date(b.date)),
      lastUpdated: team.lastUpdated
    };
  } catch (error) {
    console.error('Erro ao buscar jogos da equipa:', error);
    return null;
  }
}