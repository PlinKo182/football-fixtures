import connectToDatabase from '../../../lib/mongodb.js';
import { getLeagueModelCurrent } from '../../../models/Team.js';
import { LEAGUE_MAPPINGS } from '../../../lib/teams.js';

export async function GET() {
  try {
    console.log('🧹 Limpando dados atuais para reimportação...');
    
    await connectToDatabase();
    
    // Limpar dados de todas as ligas atuais
    for (const [leagueName] of Object.entries(LEAGUE_MAPPINGS)) {
      const LeagueModel = getLeagueModelCurrent(leagueName);
      const result = await LeagueModel.deleteMany({});
      console.log(`🗑️  ${leagueName}: ${result.deletedCount} equipas removidas`);
    }
    
    console.log('✅ Limpeza concluída');
    
    return Response.json({
      success: true,
      message: 'Dados atuais limpos com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}