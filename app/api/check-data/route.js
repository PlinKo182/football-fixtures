import { NextResponse } from 'next/server';
import { checkDatabaseForGames, ensureDataExists } from '@/lib/dataLoader';

// API para verificar se há dados no banco
export async function GET() {
  try {
    const hasData = await checkDatabaseForGames();
    
    // Se não há dados, automaticamente tenta carregar diretamente do SportsRadar
    if (!hasData) {
      console.log('Base de dados vazia. Iniciando carregamento automático do SportsRadar...');
      
      try {
        const loadResult = await ensureDataExists();
        
        if (loadResult) {
          const finalGameCount = await checkDatabaseForGames();
          return NextResponse.json({
            hasData: false,
            autoLoaded: true,
            message: 'Dados carregados automaticamente da API SportRadar',
            finalHasData: finalGameCount
          });
        } else {
          return NextResponse.json({
            hasData: false,
            autoLoaded: false,
            message: 'Falha ao carregar dados da API SportRadar'
          });
        }
      } catch (autoLoadError) {
        console.error('Erro no carregamento automático:', autoLoadError);
        return NextResponse.json({
          hasData: false,
          autoLoaded: false,
          error: 'Erro no carregamento automático',
          details: autoLoadError.message
        });
      }
    }
    
    return NextResponse.json({
      hasData: true,
      message: 'Dados disponíveis no banco'
    });
    
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
    return NextResponse.json(
      { status: 500 }
    );
  }
}