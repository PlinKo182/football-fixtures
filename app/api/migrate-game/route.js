import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Game from '@/models/Game';
import HistoricalGame from '@/models/HistoricalGame';

export async function POST(req) {
  try {
    await connectToDatabase();
    
    const { gameId, testMode = true } = await req.json();
    
    if (!gameId) {
      return NextResponse.json({ error: 'gameId é obrigatório' }, { status: 400 });
    }
    
    // Buscar o jogo original
    const game = await Game.findById(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }
    
    // Verificar se já existe na base histórica
    const existingHistorical = await HistoricalGame.findOne({
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      date: game.date
    });
    
    if (existingHistorical) {
      return NextResponse.json({ 
        error: 'Jogo já existe na base histórica',
        historicalGame: existingHistorical
      }, { status: 409 });
    }
    
    // Criar entrada histórica
    const historicalData = {
      league: game.league,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      date: game.date,
      time: game.time,
      homeScore: game.homeScore || 0,
      awayScore: game.awayScore || 0,
      status: 'finished',
      season: HistoricalGame.calculateSeason(game.date),
      originalGameId: game._id.toString(),
      sportRadarId: game.sportRadarId
    };
    
    // Calcular odds apenas para jogos finalizados. Para segurança, só migramos jogos com resultado.
    let drawOdds = null;

    // Se o jogo tem resultado (finalizado), calcular odds obrigatórias
    if (game.homeScore !== undefined && game.awayScore !== undefined) {
      // Se o jogo tem customOdds, usar essas
      if (game.customOdds && game.customOdds.draw) {
        drawOdds = game.customOdds.draw;
      } else {
        // Calcular odds inteligentes baseadas nas equipas
        const strongTeams = ['Barcelona', 'Real Madrid', 'Man City', 'Arsenal', 'PSG', 'Bayern'];
        const isStrongGame = strongTeams.includes(game.homeTeam) || strongTeams.includes(game.awayTeam);
        drawOdds = isStrongGame ? 2.8 : 3.2;
      }
    }
    
    historicalData.drawOdds = drawOdds;
    
    // Manter teamOdds para compatibilidade (opcional)
    const teamOdds = new Map();
    teamOdds.set(game.homeTeam, { draw: drawOdds });
    teamOdds.set(game.awayTeam, { draw: drawOdds });
    historicalData.teamOdds = teamOdds;
    
    if (testMode) {
      return NextResponse.json({
        message: '🧪 MODO TESTE - Nada foi salvo',
        originalGame: game,
        wouldCreate: historicalData,
        drawOdds: drawOdds,
        teamOddsPreview: Object.fromEntries(teamOdds)
      });
    }
    
    // Criar o jogo histórico
    const historicalGame = await HistoricalGame.create(historicalData);
    
    return NextResponse.json({
      message: '✅ Jogo migrado com sucesso',
      historicalGame,
      originalGame: game
    });
    
  } catch (error) {
    console.error('Erro na migração:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    
    // Listar jogos candidatos à migração (com resultado)
    const finishedGames = await Game.find({
      $and: [
        { homeScore: { $exists: true, $ne: null } },
        { awayScore: { $exists: true, $ne: null } }
      ]
    }).limit(10).sort({ date: -1 });
    
    const candidates = finishedGames.map(game => ({
      _id: game._id,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      date: game.date,
      score: `${game.homeScore}-${game.awayScore}`,
      hasCustomOdds: !!(game.customOdds && game.customOdds.draw),
      customOdds: game.customOdds?.draw
    }));
    
    return NextResponse.json({
      message: 'Jogos candidatos à migração',
      candidates,
      count: candidates.length
    });
    
  } catch (error) {
    console.error('Erro ao listar candidatos:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}