import { NextResponse } from 'next/server';
import { getAllGames, getTeamGames } from '@/lib/dataLoader';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league');
    const team = searchParams.get('team');
    
    // Se especificar liga e equipa, buscar jogos da equipa
    if (league && team) {
      const teamData = await getTeamGames(league, team);
      
      if (!teamData) {
        return NextResponse.json(
          { error: 'Equipa não encontrada' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: teamData
      });
    }
    
    // Caso contrário, buscar todos os jogos
    const allGames = await getAllGames();
    
    return NextResponse.json({
      success: true,
      data: allGames,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}