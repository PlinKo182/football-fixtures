import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Game from '@/models/Game';

// API para verificar se há dados no banco
export async function GET() {
  try {
    await connectToDatabase();
    
    const gameCount = await Game.countDocuments();
    const hasData = gameCount > 0;
    
    // Se não há dados, automaticamente tenta carregar
    if (!hasData) {
      console.log('Base de dados vazia. Iniciando carregamento automático...');
      
      try {
        // Chama internamente a API de update
        const updateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/update-fixtures`, {
          method: 'POST'
        });
        
        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          return NextResponse.json({
            hasData: false,
            autoLoaded: true,
            message: 'Dados carregados automaticamente da API SportRadar',
            stats: updateData.stats
          });
        }
      } catch (autoLoadError) {
        console.error('Erro no carregamento automático:', autoLoadError);
      }
    }
    
    return NextResponse.json({
      hasData,
      gameCount,
      message: hasData ? 'Dados disponíveis no banco' : 'Banco vazio - necessário carregar dados'
    });
    
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
    return NextResponse.json(
      { 
        hasData: false, 
        error: 'Erro ao conectar com o banco de dados',
        details: error.message 
      },
      { status: 500 }
    );
  }
}