import { saveHistoricalData } from '@/lib/historicalDataLoader';

export async function GET() {
  try {
    console.log('🚀 Iniciando importação COMPLETA da La Liga 2024-25...');
    
    const result = await saveHistoricalData('laliga', '2024-25');
    
    return Response.json({
      success: true,
      message: 'Importação completa da La Liga 2024-25 concluída',
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na importação completa:', error);
    
    return Response.json({
      success: false,
      message: 'Erro na importação completa',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}