import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Game from '@/models/Game';

export async function POST(request) {
  try {
    const { gameId, homeTeam, awayTeam, date, drawOdds } = await request.json();
    
    console.log('🎯 Atualizando odds:', { gameId, homeTeam, awayTeam, date, drawOdds });
    
    if (!drawOdds || drawOdds <= 0) {
      return NextResponse.json(
        { success: false, error: 'Odds inválidas' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Encontrar o jogo por critérios múltiplos para maior precisão
    const query = {};
    
    if (gameId && gameId.startsWith('67')) {
      // Se parece com ObjectId do MongoDB
      query._id = gameId;
    } else {
      // Usar homeTeam, awayTeam e data
      query.homeTeam = homeTeam;
      query.awayTeam = awayTeam;
      query.date = new Date(date);
    }
    
    console.log('📊 Query para encontrar jogo:', query);
    
    const updatedGame = await Game.findOneAndUpdate(
      query,
      {
        $set: {
          'customOdds.draw': parseFloat(drawOdds)
        }
      },
      { 
        new: true,
        upsert: false
      }
    );
    
    if (!updatedGame) {
      console.log('❌ Jogo não encontrado');
      return NextResponse.json(
        { success: false, error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }
    
    console.log('✅ Odds atualizadas com sucesso:', updatedGame.customOdds);
    
    return NextResponse.json({
      success: true,
      game: {
        _id: updatedGame._id,
        homeTeam: updatedGame.homeTeam,
        awayTeam: updatedGame.awayTeam,
        date: updatedGame.date,
        customOdds: updatedGame.customOdds
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar odds:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}