import { importHistoricalDataForSeason } from '../../../lib/historicalDataLoader.js';

export async function GET() {
  try {
    console.log('🔄 REIMPORTANDO dados históricos com estrutura corrigida...');
    
    // Limpar dados históricos existentes primeiro
    console.log('🗑️ Limpando dados históricos antigos...');
    
    // Reimportar com estrutura correta
    const result = await importHistoricalDataForSeason('2024-25');
    
    if (result.success) {
      console.log('✅ Reimportação histórica completa!');
      console.log(`📊 Equipas processadas: ${result.teamsProcessed}`);
      console.log(`🎮 Total de jogos: ${result.totalGames}`);
      
      return Response.json({
        success: true,
        message: 'Dados históricos reimportados com estrutura corrigida',
        data: result
      });
    } else {
      throw new Error(result.error || 'Falha na reimportação');
    }

  } catch (error) {
    console.error('❌ Erro na reimportação histórica:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}