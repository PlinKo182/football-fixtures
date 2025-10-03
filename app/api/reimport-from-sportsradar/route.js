import { saveHistoricalData } from '../../../lib/historicalDataLoader.js';
import connectToDatabase from '../../../lib/mongodb.js';
import { getHistoricalModel } from '../../../lib/historicalDataLoader.js';

export async function GET() {
  try {
    console.log('🚀 Reimportando dados históricos REAIS da SportsRadar...');
    
    await connectToDatabase();
    
    // Limpar dados de teste existentes
    const HistoricalModel = getHistoricalModel('laliga', '2024-25');
    await HistoricalModel.deleteMany({});
    console.log('🗑️  Dados de teste removidos');
    
    // Importar dados reais da SportsRadar usando estrutura correta
    const result = await saveHistoricalData('La Liga', '2024-25');
    
    console.log('✅ Importação completa:', result);
    
    // Verificar se os dados foram importados corretamente
    const importedTeams = await HistoricalModel.find({}).lean();
    
    console.log(`📊 Equipas importadas: ${importedTeams.length}`);
    
    const summary = importedTeams.map(team => ({
      team: team.teamName,
      games: team.games.length,
      gamesWithResults: team.games.filter(game => 
        game.teamScore !== null && game.opponentScore !== null
      ).length
    }));
    
    console.log('📋 Resumo:', summary);
    
    return Response.json({
      success: true,
      message: 'Dados históricos reais reimportados da SportsRadar',
      importResult: result,
      teamsImported: importedTeams.length,
      summary: summary,
      totalGames: summary.reduce((sum, team) => sum + team.games, 0),
      totalGamesWithResults: summary.reduce((sum, team) => sum + team.gamesWithResults, 0)
    });

  } catch (error) {
    console.error('❌ Erro na reimportação:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}