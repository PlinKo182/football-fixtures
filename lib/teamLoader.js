import connectToDatabase from './mongodb.js';
import { getLeagueModelCurrent } from '../models/Team.js';
import { getLeagueByTeam } from './teams.js';
import { getTeamHistoricalGames } from './historicalDataLoader.js';
import mongoose from 'mongoose';
import { getApostasConnection } from './apostas.js';
import { getCachedTeamCollectionMap, setCachedTeamCollectionMap } from './apostas.js';

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
    
    // 1. Buscar época atual da base Empates (2025-26 sem odds)
    const empatesData = await getTeamGamesOptimized(teamName);
    
    // 2. Buscar da base Apostas (época atual + histórica)
    const apostasData = await getTeamGamesFromApostas(teamName);
    
    // 3. Combinar tudo
    return combineEmpatesWithApostas(empatesData, apostasData, includeHistorical);
    
  } catch (error) {
    console.error('❌ Erro ao buscar jogos completos:', error);
    return await getTeamGamesOptimized(teamName); // Fallback para dados atuais apenas
  }
}

// Buscar dados da base Apostas (época atual + histórica)
export async function getTeamGamesFromApostas(teamName) {
  try {
    console.log('🎯 Buscando dados na base APOSTAS para:', teamName);
    console.log('🚨 NOVA VERSÃO - Debug estrutura de dados!');
  // Use cached apostas connection helper
  const apostasConnection = await getApostasConnection();
    
    // Detectar liga
    const leagueName = getLeagueByTeam(teamName);
    if (!leagueName) {
      console.log('❌ Liga não encontrada para', teamName);
      await apostasConnection.close();
      return null;
    }
    console.log('🏆 Liga detectada:', leagueName);
    
    const TeamSchema = new mongoose.Schema({}, { strict: false });

    // Buscar época atual (2025-26) - jogos com odds definidas
    const currentModel = leagueName.toLowerCase().replace(/\s+/g, '') + '_2025_26';
    console.log('📊 Modelo época atual:', currentModel);
    let CurrentApostasTeam;
    if (apostasConnection.models && apostasConnection.models[currentModel]) {
      CurrentApostasTeam = apostasConnection.model(currentModel);
    } else {
      CurrentApostasTeam = apostasConnection.model(currentModel, TeamSchema);
    }
    const currentData = await CurrentApostasTeam.findOne({ teamName }).lean();
    console.log('✅ Dados época atual encontrados:', currentData ? `${currentData.games?.length || 0} jogos` : 'Não');
    
    // Buscar época histórica (2024-25) - já migrados anteriormente
    const historicalModel = leagueName.toLowerCase().replace(/\s+/g, '') + '_2024_25';
    console.log('📚 Modelo época histórica:', historicalModel);
    let HistoricalApostasTeam;
    if (apostasConnection.models && apostasConnection.models[historicalModel]) {
      HistoricalApostasTeam = apostasConnection.model(historicalModel);
    } else {
      HistoricalApostasTeam = apostasConnection.model(historicalModel, TeamSchema);
    }
    const historicalData = await HistoricalApostasTeam.findOne({ teamName }).lean();
    console.log('✅ Dados época histórica encontrados:', historicalData ? `${historicalData.games?.length || 0} jogos` : 'Não');
    
  // do not close cached connection
    
    return {
      teamName,
      league: leagueName,
      currentGames: currentData?.games || [],
      historicalGames: historicalData?.games || [],
      source: 'Apostas'
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados da base Apostas:', error);
    return null;
  }
}

// Batch query: fetch upcoming games across leagues from Apostas in one pass
export async function getUpcomingFromApostas({ withinDays = 14, limit = 200 } = {}) {
  try {
    const conn = await getApostasConnection();
    const now = new Date();
    const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

    // Try to use cached team->collection map to avoid listing all collections
    let map = getCachedTeamCollectionMap();
    const TeamSchema = new mongoose.Schema({}, { strict: false });
    const foundGames = [];

    if (!map) {
      const collections = await conn.db.listCollections().toArray();
      const seasonSuffix = '_2025_26';
      const teamCollections = collections
        .map(c => c.name)
        .filter(name => name.endsWith(seasonSuffix));

      map = {};
      for (const collName of teamCollections) {
        try {
          let Model;
          if (conn.models && conn.models[collName]) {
            Model = conn.model(collName);
          } else {
            Model = conn.model(collName, TeamSchema, collName);
          }
          const docs = await Model.find({}).lean();
          for (const doc of docs) {
            if (doc.teamName) map[doc.teamName] = collName;
          }
        } catch (e) {
          console.warn('⚠️ Skipping collection', collName, e.message || e);
        }
      }

      // Cache the mapping for subsequent requests
      setCachedTeamCollectionMap(map);
    }

    // Use the map to fetch docs for each team and collect future games
    for (const [teamName, collName] of Object.entries(map)) {
      try {
        let Model;
        if (conn.models && conn.models[collName]) {
          Model = conn.model(collName);
        } else {
          Model = conn.model(collName, TeamSchema, collName);
        }
        const doc = await Model.findOne({ teamName }).lean();
        if (!doc) continue;
        const league = collName.replace(/_2025_26$/, '');
        const games = (doc.games || []).filter(g => {
          const gd = g.date ? new Date(g.date) : null;
          return gd && gd > now && gd < cutoff;
        }).map(g => ({ teamName, league, game: g }));

        for (const g of games) foundGames.push(g);
      } catch (e) {
        console.warn('⚠️ Error reading team doc from collection', collName, e.message || e);
      }
    }

    // Convert to homepage shape and dedupe by home/away/date
    const added = new Set();
    const upcoming = [];
    for (const rec of foundGames) {
      const game = rec.game;
      const teamName = rec.teamName;
      const homeTeam = game.homeTeam ?? (game.isHome ? teamName : game.opponent);
      const awayTeam = game.awayTeam ?? (game.isHome ? game.opponent : teamName);
      const dateIso = game.date ? new Date(game.date).toISOString() : null;
      const uniqueId = `${rec.league}_${homeTeam}_${awayTeam}_${dateIso}`;
      if (!added.has(uniqueId)) {
        added.add(uniqueId);
        upcoming.push({
          id: uniqueId,
          homeTeam,
          awayTeam,
          league: rec.league,
          date: dateIso,
          status: game.status || 'scheduled',
          teamOfInterest: null, // will be filled by caller
          // If a numeric drawOdds exists (manual set), keep it even for scheduled games.
          hasOdds: (typeof game.drawOdds === 'number'),
          drawOdds: game.drawOdds ?? null
        });
      }
    }

    // Sort by date ascending and limit
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    return upcoming.slice(0, limit);
  } catch (error) {
    console.error('❌ Erro em getUpcomingFromApostas:', error);
    return [];
  }
}

// Combinar dados: Empates (atual sem odds) + Apostas (atual com odds + histórico)
function combineEmpatesWithApostas(empatesData, apostasData, includeHistorical) {
  if (!empatesData && !apostasData) return null;
  if (!empatesData) return formatApostasData(apostasData, includeHistorical);
  if (!apostasData) return empatesData;
  
  // Jogos atuais da base Apostas (com odds definidas)
  // Se o jogo estiver agendado/pending (status 'scheduled'), considerar drawOdds = null
  const currentApostasGames = apostasData.currentGames.map(game => ({ 
    ...game, 
    // Preserve numeric drawOdds coming from Apostas (manual edits). Only treat as null when truly undefined.
    drawOdds: (typeof game.drawOdds === 'number') ? game.drawOdds : (game.status === 'scheduled' ? null : game.drawOdds),
    hasOdds: (typeof game.drawOdds === 'number'),
    season: '2025-26',
    source: 'apostas',
    // Normalize date to ISO string
    date: (game.date ? new Date(game.date).toISOString() : null),
    // Ensure homeTeam/awayTeam exist using opponent + isHome
    homeTeam: game.homeTeam ?? (game.isHome ? apostasData.teamName : game.opponent),
    awayTeam: game.awayTeam ?? (game.isHome ? game.opponent : apostasData.teamName)
  }));
  
  // 🔍 DEBUGGING: Verificar estrutura dos jogos Apostas
  if (currentApostasGames.length > 0) {
    console.log(`🎯 ESTRUTURA dos jogos Apostas:`, {
      opponent: currentApostasGames[0].opponent,
      isHome: currentApostasGames[0].isHome,
      homeTeam: currentApostasGames[0].homeTeam,
      awayTeam: currentApostasGames[0].awayTeam,
      drawOdds: currentApostasGames[0].drawOdds,
      hasOdds: currentApostasGames[0].hasOdds
    });
  }
  
  // Jogos atuais da base Empates (sem odds)
  // Como são jogos sem odds, garantir drawOdds = null
  const empatesGames = empatesData.games.map(game => ({ 
    ...game, 
    drawOdds: null,
    hasOdds: false, 
    season: '2025-26',
    source: 'empates',
    date: (game.date ? new Date(game.date).toISOString() : null),
    homeTeam: game.homeTeam ?? (game.isHome ? empatesData.teamName : game.opponent),
    awayTeam: game.awayTeam ?? (game.isHome ? game.opponent : empatesData.teamName)
  }));
  
  // Remover duplicados: se existe na Apostas (com odds), não incluir da Empates
  const filteredEmpatesGames = empatesGames.filter(empGame => 
    !currentApostasGames.some(apGame => 
      empGame.opponent === apGame.opponent && 
      empGame.isHome === apGame.isHome &&
      new Date(empGame.date).toISOString() === new Date(apGame.date).toISOString()
    )
  );
  
  // Combinar jogos atuais
  let allGames = [...currentApostasGames, ...filteredEmpatesGames];
  
  // Adicionar jogos históricos se solicitado
  if (includeHistorical && apostasData.historicalGames.length > 0) {
    const historicalGames = apostasData.historicalGames.map(game => ({ 
      ...game, 
      // For historical games keep numeric drawOdds; treat missing values appropriately
      drawOdds: (typeof game.drawOdds === 'number') ? game.drawOdds : (game.status === 'scheduled' ? null : game.drawOdds),
      hasOdds: (typeof game.drawOdds === 'number'),
      season: '2024-25',
      source: 'apostas-historical',
      date: (game.date ? new Date(game.date).toISOString() : null),
      homeTeam: game.homeTeam ?? (game.isHome ? apostasData.teamName : game.opponent),
      awayTeam: game.awayTeam ?? (game.isHome ? game.opponent : apostasData.teamName)
    }));
    allGames = [...allGames, ...historicalGames];
  }
  
  // Ordenar por data
  allGames.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  console.log('✅ Dados completos (Sistema Dual):', {
    teamName: empatesData.teamName,
    totalGames: allGames.length,
    empatesGames: filteredEmpatesGames.length,
    apostasCurrentGames: currentApostasGames.length,
    apostasHistoricalGames: includeHistorical ? apostasData.historicalGames.length : 0,
    gamesWithOdds: allGames.filter(g => g.hasOdds).length
  });

  // 🔍 DEBUGGING: Verificar hasOdds nos jogos finais
  const gamesWithOddsFlag = allGames.filter(game => game.hasOdds === true);
  console.log(`🎯 VERIFICAÇÃO hasOdds: ${gamesWithOddsFlag.length} jogos com hasOdds=true`);
  if (gamesWithOddsFlag.length > 0) {
    console.log(`🎯 EXEMPLO de jogo com odds:`, {
      homeTeam: gamesWithOddsFlag[0].homeTeam,
      awayTeam: gamesWithOddsFlag[0].awayTeam,
      date: gamesWithOddsFlag[0].date,
      hasOdds: gamesWithOddsFlag[0].hasOdds,
      drawOdds: gamesWithOddsFlag[0].drawOdds,
      opponent: gamesWithOddsFlag[0].opponent,
      isHome: gamesWithOddsFlag[0].isHome
    });
  }
  
  return {
    teamName: empatesData.teamName,
    league: empatesData.league,
    games: allGames,
    seasons: includeHistorical ? ['2025-26', '2024-25'] : ['2025-26'],
    lastUpdated: empatesData.lastUpdated
  };
}

// Formatar dados apenas da base Apostas (caso não haja dados em Empates)
function formatApostasData(apostasData, includeHistorical) {
  let allGames = apostasData.currentGames.map(game => ({ 
    ...game, 
    // Preserve numeric drawOdds when present (manual set). Otherwise null for scheduled games.
    drawOdds: (typeof game.drawOdds === 'number') ? game.drawOdds : (game.status === 'scheduled' ? null : game.drawOdds),
    hasOdds: (typeof game.drawOdds === 'number'),
    season: '2025-26',
    source: 'apostas',
    date: (game.date ? new Date(game.date).toISOString() : null),
    homeTeam: game.homeTeam ?? (game.isHome ? apostasData.teamName : game.opponent),
    awayTeam: game.awayTeam ?? (game.isHome ? game.opponent : apostasData.teamName)
  }));
  
  if (includeHistorical) {
    const historicalGames = apostasData.historicalGames.map(game => ({ 
      ...game, 
      drawOdds: game.status === 'scheduled' ? null : game.drawOdds,
      hasOdds: game.status !== 'scheduled' && !!game.drawOdds,
      season: '2024-25' 
    }));
    allGames = [...allGames, ...historicalGames];
  }
  
  allGames.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return {
    teamName: apostasData.teamName,
    league: apostasData.league,
    games: allGames,
    seasons: includeHistorical ? ['2025-26', '2024-25'] : ['2025-26']
  };
}