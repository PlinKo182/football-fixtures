import { saveHistoricalData } from '../../../lib/historicalDataLoader.js';

export async function GET() {
  try {
    console.log('🚀 Testando importação histórica com estrutura correta...');
    
    // Importar dados históricos da La Liga 2024/25 usando a nova estrutura
    const result = await saveHistoricalData('La Liga', '2024-25');
    
    console.log('✅ Resultado da importação:', result);
    
    return Response.json({
      success: true,
      message: 'Importação histórica testada com estrutura correta',
      result: result,
      season: '2024-25',
      league: 'La Liga'
    });

  } catch (error) {
    console.error('❌ Erro no teste de importação histórica:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}