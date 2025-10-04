import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// URLs das bases de dados
const EMPATES_URI = process.env.MONGODB_URI;
const APOSTAS_URI = process.env.MONGODB_URI.replace('/Empates', '/Apostas');

// Schema flexível para ambas as bases
const TeamSchema = new mongoose.Schema({}, { strict: false });

export async function POST(request) {
  try {
    const { gameId, homeTeam, awayTeam, date, drawOdds } = await request.json();
    
    console.log('🎯 DEFININDO ODDS (Sistema Dual):', { gameId, homeTeam, awayTeam, date, drawOdds });
    
    // Validar odds: aceitar null (remover odd) ou string/number com vírgula/ponto
    let oddsValue = null;
    if (drawOdds === null || drawOdds === undefined) {
      oddsValue = null;
    } else if (typeof drawOdds === 'string') {
      const normalized = drawOdds.replace(',', '.').trim();
      if (normalized === '') oddsValue = null;
      else oddsValue = parseFloat(normalized);
    } else if (typeof drawOdds === 'number') {
      oddsValue = drawOdds;
    }

    if (oddsValue !== null) {
      if (Number.isNaN(oddsValue) || oddsValue < 1.01 || oddsValue > 50.0) {
        return NextResponse.json(
          { success: false, error: 'Odds devem estar entre 1.01 e 50.0' },
          { status: 400 }
        );
      }
    }
    
    // Conectar às duas bases
    const empatesConnection = mongoose.createConnection(EMPATES_URI);
    const apostasConnection = mongoose.createConnection(APOSTAS_URI);
    
    await Promise.all([
      empatesConnection.asPromise(),
      apostasConnection.asPromise()
    ]);
    
    console.log('🔌 Conectado às duas bases de dados');
    
    // Detectar liga baseada nos times
    const leagues = [
      { name: 'La Liga', teams: ['Bétis', 'Atl. Bilbao', 'Osasuna'] },
      { name: 'Ligue 1', teams: ['Nantes', 'Nice', 'Toulouse', 'Mónaco', 'Lille', 'Brest'] },
      { name: 'Premier League', teams: ['Brighton', 'West Ham', 'Everton', 'Aston Villa', 'Wolverhampton'] }
    ];
    
    const league = leagues.find(l => 
      l.teams.some(team => team.toLowerCase() === homeTeam.toLowerCase()) ||
      l.teams.some(team => team.toLowerCase() === awayTeam.toLowerCase())
    );
    
    if (!league) {
      return NextResponse.json(
        { success: false, error: 'Liga não encontrada para estas equipas' },
        { status: 400 }
      );
    }
    
    const modelName = league.name.toLowerCase().replace(/\s+/g, '') + '_2025_26';
    console.log('🏆 Liga detectada:', league.name, '- Modelo:', modelName);
    
    // Buscar jogo na base Empates
    const EmpatesTeam = empatesConnection.model(modelName, TeamSchema);
    
    console.log('🔍 Procurando equipas:', homeTeam, 'ou', awayTeam, 'no modelo:', modelName);
    
    // Listar todas as equipas disponíveis para debug
    const allTeams = await EmpatesTeam.find({}, { teamName: 1 }).limit(10);
    console.log('📋 Equipas disponíveis na base:', allTeams.map(t => t.teamName));
    
    const team = await EmpatesTeam.findOne({
      $or: [{ teamName: homeTeam }, { teamName: awayTeam }]
    });
    
    if (!team) {
      await empatesConnection.close();
      await apostasConnection.close();
      return NextResponse.json(
        { success: false, error: `Equipa '${homeTeam}' ou '${awayTeam}' não encontrada na base Empates. Disponíveis: ${allTeams.map(t => t.teamName).join(', ')}` },
        { status: 404 }
      );
    }
    
    console.log('✅ Equipa encontrada:', team.teamName, 'com', team.games.length, 'jogos');
    
    // Debug: mostrar alguns jogos da equipa (estrutura completa)
    const sampleGames = team.games.slice(0, 2).map(g => ({
      fullGame: g,
      keys: Object.keys(g),
      home: g.homeTeam || g.home_team || g.home || g.teamHome,
      away: g.awayTeam || g.away_team || g.away || g.teamAway,
      date: g.date || g.gameDate || g.match_date
    }));
    console.log('🎮 Estrutura dos jogos:', JSON.stringify(sampleGames, null, 2));
    
    // Encontrar o jogo específico usando a estrutura correcta (opponent + isHome)
    const targetGame = team.games.find(game => {
      const gameDate = new Date(game.date);
      const requestDate = new Date(date);
      
      // Determinar home/away baseado na estrutura: teamName + opponent + isHome
      const gameHome = game.isHome ? team.teamName : game.opponent;
      const gameAway = game.isHome ? game.opponent : team.teamName;
      
      console.log('🔍 Comparando:', {
        teamName: team.teamName,
        opponent: game.opponent,
        isHome: game.isHome,
        gameHome,
        gameAway,
        gameDate: gameDate.toISOString(),
        requestHome: homeTeam,
        requestAway: awayTeam,
        requestDate: requestDate.toISOString(),
        timeDiff: Math.abs(gameDate - requestDate)
      });
      
      // Comparar tudo: homeTeam == gameHome && awayTeam == gameAway && date == date
      const teamsMatch = (gameHome === homeTeam && gameAway === awayTeam);
      const dateMatch = (gameDate.toISOString() === requestDate.toISOString());
      
      const exactMatch = teamsMatch && dateMatch;
      
      if (exactMatch) {
        console.log('✅ JOGO ENCONTRADO!', gameHome, '(casa) vs', gameAway, '(fora) em', gameDate.toISOString());
      } else if (teamsMatch) {
        console.log('🔄 Equipas certas mas data diferente:', gameDate.toISOString(), 'vs', requestDate.toISOString());
      }
      
      return exactMatch;
    });
    
    if (!targetGame) {
      console.log('🔍 Jogo não encontrado na base Empates. Procurando na base Apostas...');
      
      // Tentar na base Apostas (dados históricos)
      const ApostasTeam = apostasConnection.model(modelName, TeamSchema);
      const apostasTeam = await ApostasTeam.findOne({
        $or: [{ teamName: homeTeam }, { teamName: awayTeam }]
      });
      
      if (apostasTeam) {
        console.log('✅ Equipa encontrada na base Apostas:', apostasTeam.teamName);
        
        const historicalGame = apostasTeam.games.find(game => {
          const gameDate = new Date(game.date);
          const requestDate = new Date(date);
          
          const gameHome = game.isHome ? apostasTeam.teamName : game.opponent;
          const gameAway = game.isHome ? game.opponent : apostasTeam.teamName;
          
          // Comparar tudo: homeTeam == gameHome && awayTeam == gameAway && date == date
          const teamsMatch = (gameHome === homeTeam && gameAway === awayTeam);
          const dateMatch = (gameDate.toISOString() === requestDate.toISOString());
          
          return teamsMatch && dateMatch;
        });
        
        if (historicalGame) {
          console.log('✅ Jogo histórico encontrado! Atualizando odds...');
          historicalGame.drawOdds = oddsValue;
          await apostasTeam.save();
          
          await empatesConnection.close();
          await apostasConnection.close();
          
          return NextResponse.json({
            success: true,
            message: 'Odds atualizadas no jogo histórico',
            game: {
              homeTeam: historicalGame.isHome ? apostasTeam.teamName : historicalGame.opponent,
              awayTeam: historicalGame.isHome ? historicalGame.opponent : apostasTeam.teamName,
              date: historicalGame.date,
              drawOdds: oddsValue,
              league: league.name,
              status: 'Atualizado na base Apostas'
            }
          });
        }
      }
      
      await empatesConnection.close();
      await apostasConnection.close();
      return NextResponse.json(
        { success: false, error: `Jogo '${homeTeam} vs ${awayTeam}' em ${date} não encontrado em nenhuma base. Verifique os nomes das equipas e data.` },
        { status: 404 }
      );
    }
    
  // Adicionar odds ao jogo (pode ser null para remover odd em jogos agendados)
  targetGame.drawOdds = oddsValue;
    // Persistir a alteração na base Empates para que a fonte primária reflita a mudança
    try {
      await team.save();
      console.log('💾 Alteração gravada na base Empates');
    } catch (e) {
      console.warn('⚠️ Falha ao gravar na base Empates, prosseguindo com migração para Apostas', e);
    }
    
    // MIGRAÇÃO IMEDIATA: Mover para base Apostas
    const ApostasTeam = apostasConnection.model(modelName, TeamSchema);
    
    // Verificar se a equipa já existe na base Apostas
    let apostasTeam = await ApostasTeam.findOne({ teamName: team.teamName });
    
    if (!apostasTeam) {
      // Criar nova equipa na base Apostas
      apostasTeam = new ApostasTeam({
        teamName: team.teamName,
        league: team.league,
        games: []
      });
    }
    
    // Verificar se o jogo já existe na base Apostas (usar estrutura opponent/isHome)
    const existingGameIndex = apostasTeam.games.findIndex(g => {
      const gameDate = new Date(g.date);
      const targetDate = new Date(targetGame.date);
      const timeDiff = Math.abs(gameDate - targetDate);
      
      // Comparar usando opponent/isHome (estrutura da época atual)
      return g.opponent === targetGame.opponent && 
             g.isHome === targetGame.isHome &&
             timeDiff < 24 * 60 * 60 * 1000;
    });
    
    if (existingGameIndex >= 0) {
  // Atualizar jogo existente usando updateOne com operador posicional para garantir persistência
      console.log('🔄 Atualizando jogo existente na base Apostas (updateOne positional)');
      const updateQuery = { teamName: apostasTeam.teamName, 'games.opponent': targetGame.opponent, 'games.isHome': targetGame.isHome };
      // Match by date proximity as well
      // Use $[elem] filtered positional operator for safer matching by date
      const targetDate = new Date(targetGame.date).toISOString();
      await apostasConnection.collection(modelName).updateOne(
        { teamName: apostasTeam.teamName },
        { $set: { 'games.$[elem].drawOdds': oddsValue } },
        { arrayFilters: [ { 'elem.opponent': targetGame.opponent, 'elem.isHome': targetGame.isHome } ] }
      );
      // Re-load apostasTeam to confirm update
      apostasTeam = await ApostasTeam.findOne({ teamName: apostasTeam.teamName });
      const updatedGame = apostasTeam.games.find(g => g.opponent === targetGame.opponent && g.isHome === targetGame.isHome && Math.abs(new Date(g.date) - new Date(targetGame.date)) < 24*60*60*1000);
      console.log('🔎 Jogo na Apostas após update:', updatedGame ? { date: updatedGame.date, drawOdds: updatedGame.drawOdds } : 'Não encontrado');
    } else {
      // Adicionar novo jogo
      apostasTeam.games.push(targetGame);
      console.log('➕ Adicionando novo jogo à base Apostas');
      await apostasTeam.save();
    }
    
    // Fechar conexões
    await empatesConnection.close();
    await apostasConnection.close();
    
    console.log('🎯 MIGRAÇÃO CONCLUÍDA! Odds definidas e jogo protegido');
    
    return NextResponse.json({
      success: true,
      message: 'Odds definidas e jogo migrado para base protegida',
      game: {
        homeTeam: targetGame.homeTeam,
        awayTeam: targetGame.awayTeam,
        date: targetGame.date,
        drawOdds: oddsValue,
        league: league.name,
        status: 'Protegido na base Apostas'
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no sistema dual:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}