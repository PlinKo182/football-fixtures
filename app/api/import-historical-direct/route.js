import { importAllHistoricalData } from '@/lib/historicalDataLoader';

export async function GET() {
  try {
    console.log('🚀 Iniciando importação automática de dados históricos...');
    
    const results = await importAllHistoricalData('2024-25');
    
    return Response.json({
      success: true,
      message: 'Dados históricos importados com sucesso!',
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