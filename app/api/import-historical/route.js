import { importAllHistoricalData, saveHistoricalData } from '@/lib/historicalDataLoader';

export async function POST(request) {
  try {
    const { league, season } = await request.json();
    
    console.log('🔄 Iniciando importação de dados históricos...');
    console.log('Parâmetros:', { league, season });
    
    let results;
    
    if (league && season) {
      // Importar liga específica
      results = await saveHistoricalData(league, season);
    } else {
      // Importar todas as ligas da época 2024-25
      results = await importAllHistoricalData(season || '2024-25');
    }
    
    return Response.json({
      success: true,
      message: 'Dados históricos importados com sucesso',
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na importação:', error);
    
    return Response.json({
      success: false,
      message: 'Erro ao importar dados históricos',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: 'Endpoint para importação de dados históricos',
    usage: {
      POST: {
        description: 'Importar dados históricos',
        body: {
          league: 'Liga específica (opcional): laliga, premierleague, ligue1',
          season: 'Época (opcional, padrão: 2024-25): 2024-25, 2023-24, etc'
        },
        examples: [
          { description: 'Importar todas as ligas da época 2024-25', body: {} },
          { description: 'Importar só La Liga 2024-25', body: { league: 'laliga', season: '2024-25' } }
        ]
      }
    }
  });
}