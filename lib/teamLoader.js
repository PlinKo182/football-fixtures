import connectToDatabase from './mongodb.js';
import { getLeagueModelCurrent } from '../models/Team.js';
import { getLeagueByTeam } from './teams.js';
import { getTeamHistoricalGames } from './historicalDataLoader.js';
import mongoose from 'mongoose';

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
async function getTeamGamesFromApostas(teamName) {
  try {
    console.log('🎯 Buscando dados na base APOSTAS para:', teamName);
    console.log('🚨 NOVA VERSÃO - Debug estrutura de dados!');
    const mongoose = (await import('mongoose')).default;
    const APOSTAS_URI = process.env.MONGODB_URI.replace('/Empates', '/Apostas');
    console.log('🔗 Conectando à base Apostas:', APOSTAS_URI);
    const apostasConnection = mongoose.createConnection(APOSTAS_URI);
    await apostasConnection.asPromise();
    
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
    const CurrentApostasTeam = apostasConnection.model(currentModel, TeamSchema);
    const currentData = await CurrentApostasTeam.findOne({ teamName }).lean();
    console.log('✅ Dados época atual encontrados:', currentData ? `${currentData.games?.length || 0} jogos` : 'Não');
    
    // Buscar época histórica (2024-25) - já migrados anteriormente
    const historicalModel = leagueName.toLowerCase().replace(/\s+/g, '') + '_2024_25';
    console.log('📚 Modelo época histórica:', historicalModel);
    const HistoricalApostasTeam = apostasConnection.model(historicalModel, TeamSchema);
    const historicalData = await HistoricalApostasTeam.findOne({ teamName }).lean();
    console.log('✅ Dados época histórica encontrados:', historicalData ? `${historicalData.games?.length || 0} jogos` : 'Não');
    
    await apostasConnection.close();
    
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

// Combinar dados: Empates (atual sem odds) + Apostas (atual com odds + histórico)
function combineEmpatesWithApostas(empatesData, apostasData, includeHistorical) {
  if (!empatesData && !apostasData) return null;
  if (!empatesData) return formatApostasData(apostasData, includeHistorical);
  if (!apostasData) return empatesData;
  
  // Jogos atuais da base Apostas (com odds definidas)
  // Se o jogo estiver agendado/pending (status 'scheduled'), considerar drawOdds = null
  const currentApostasGames = apostasData.currentGames.map(game => ({ 
    ...game, 
    // Se o jogo ainda estiver agendado, não mostramos odds
    drawOdds: game.status === 'scheduled' ? null : game.drawOdds,
    hasOdds: game.status !== 'scheduled' && !!game.drawOdds,
    season: '2025-26' 
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
    season: '2025-26' 
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
      // Para jogos históricos, manter drawOdds a menos que o jogo ainda esteja agendado
      drawOdds: game.status === 'scheduled' ? null : game.drawOdds,
      hasOdds: game.status !== 'scheduled' && !!game.drawOdds, // Correto: drawOdds com 's'
      season: '2024-25' 
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
    // If scheduled/pending, treat drawOdds as null and hasOdds false
    drawOdds: game.status === 'scheduled' ? null : game.drawOdds,
    hasOdds: game.status !== 'scheduled' && !!game.drawOdds,
    season: '2025-26' 
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