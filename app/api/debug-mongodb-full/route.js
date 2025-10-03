import connectToDatabase from '../../../lib/mongodb.js';
import { getLeagueModelCurrent } from '../../../models/Team.js';
import { getHistoricalModel } from '../../../lib/historicalDataLoader.js';

export async function GET() {
  try {
    console.log('🔍 Investigando dados no MongoDB...');
    
    await connectToDatabase();
    
    // Verificar dados atuais
    console.log('📊 DADOS ATUAIS (2025-26):');
    const CurrentModel = getLeagueModelCurrent('La Liga');
    const currentData = await CurrentModel.find({}).lean();
    
    console.log(`   - Total de equipas: ${currentData.length}`);
    currentData.forEach(team => {
      console.log(`   - ${team.teamName}: ${team.games?.length || 0} jogos`);
      if (team.games && team.games.length > 0) {
        const gamesWithResults = team.games.filter(game => 
          game.teamScore !== null && game.opponentScore !== null
        );
        console.log(`     └─ Com resultados: ${gamesWithResults.length}`);
      }
    });
    
    // Verificar dados históricos
    console.log('\n📜 DADOS HISTÓRICOS (2024-25):');
    const HistoricalModel = getHistoricalModel('laliga', '2024-25');
    const historicalData = await HistoricalModel.find({}).lean();
    
    console.log(`   - Total de equipas: ${historicalData.length}`);
    historicalData.forEach(team => {
      console.log(`   - ${team.teamName}: ${team.games?.length || 0} jogos`);
      if (team.games && team.games.length > 0) {
        const gamesWithResults = team.games.filter(game => 
          game.teamScore !== null && game.opponentScore !== null
        );
        console.log(`     └─ Com resultados: ${gamesWithResults.length}`);
      }
    });
    
    // Análise detalhada do Bétis
    const betisCurrentData = currentData.find(team => team.teamName === 'Bétis');
    const betisHistoricalData = historicalData.find(team => team.teamName === 'Bétis');
    
    console.log('\n⚽ ANÁLISE DETALHADA - BÉTIS:');
    console.log('📊 Dados atuais:', betisCurrentData ? 'Encontrados' : 'Não encontrados');
    if (betisCurrentData) {
      console.log(`   - Jogos: ${betisCurrentData.games?.length || 0}`);
      console.log(`   - Última atualização: ${betisCurrentData.lastUpdated}`);
      if (betisCurrentData.games && betisCurrentData.games.length > 0) {
        const sample = betisCurrentData.games[0];
        console.log(`   - Jogo exemplo:`, JSON.stringify(sample, null, 2));
      }
    }
    
    console.log('📜 Dados históricos:', betisHistoricalData ? 'Encontrados' : 'Não encontrados');
    if (betisHistoricalData) {
      console.log(`   - Jogos: ${betisHistoricalData.games?.length || 0}`);
      console.log(`   - Última atualização: ${betisHistoricalData.lastUpdated}`);
      if (betisHistoricalData.games && betisHistoricalData.games.length > 0) {
        const sample = betisHistoricalData.games[0];
        console.log(`   - Jogo exemplo:`, JSON.stringify(sample, null, 2));
      }
    }
    
    return Response.json({
      success: true,
      mongodb: {
        current: {
          totalTeams: currentData.length,
          teams: currentData.map(team => ({
            name: team.teamName,
            games: team.games?.length || 0,
            gamesWithResults: team.games?.filter(g => g.teamScore !== null && g.opponentScore !== null).length || 0,
            lastUpdated: team.lastUpdated
          }))
        },
        historical: {
          totalTeams: historicalData.length,
          teams: historicalData.map(team => ({
            name: team.teamName,
            games: team.games?.length || 0,
            gamesWithResults: team.games?.filter(g => g.teamScore !== null && g.opponentScore !== null).length || 0,
            lastUpdated: team.lastUpdated
          }))
        },
        betisAnalysis: {
          current: betisCurrentData ? {
            exists: true,
            games: betisCurrentData.games?.length || 0,
            sampleGame: betisCurrentData.games?.[0] || null
          } : { exists: false },
          historical: betisHistoricalData ? {
            exists: true,
            games: betisHistoricalData.games?.length || 0,
            sampleGame: betisHistoricalData.games?.[0] || null
          } : { exists: false }
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao investigar MongoDB:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}