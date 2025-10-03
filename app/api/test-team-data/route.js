import { getTeamGamesWithHistory, getTeamGamesOptimized } from '@/lib/teamLoader';
import { getTeamHistoricalGames } from '@/lib/historicalDataLoader';

export async function GET() {
  try {
    const teamName = 'Bétis'; // Testar com Bétis
    
    console.log('🔍 Testando dados completos para:', teamName);
    
    // Testar dados atuais
    console.log('📊 1. Buscando dados atuais...');
    const currentData = await getTeamGamesOptimized(teamName);
    console.log('Dados atuais:', currentData ? {
      teamName: currentData.teamName,
      league: currentData.league,
      gamesCount: currentData.games?.length || 0
    } : 'null');
    
    // Testar dados históricos
    console.log('📈 2. Buscando dados históricos...');
    const historicalData = await getTeamHistoricalGames(teamName, '2024-25');
    console.log('Dados históricos:', historicalData ? {
      teamName: historicalData.teamName,
      league: historicalData.league,
      season: historicalData.season,
      gamesCount: historicalData.games?.length || 0
    } : 'null');
    
    // Testar função combinada
    console.log('🔄 3. Buscando dados combinados...');
    const combinedData = await getTeamGamesWithHistory(teamName, true);
    console.log('Dados combinados:', combinedData ? {
      teamName: combinedData.teamName,
      league: combinedData.league,
      seasons: combinedData.seasons,
      totalGames: combinedData.games?.length || 0,
      currentSeasonGames: combinedData.games?.filter(g => g.season === '2025-26').length || 0,
      historicalGames: combinedData.games?.filter(g => g.season === '2024-25').length || 0
    } : 'null');
    
    // Amostras de jogos
    let sampleGames = [];
    if (combinedData && combinedData.games) {
      sampleGames = combinedData.games.slice(0, 5).map(game => ({
        opponent: game.opponent,
        date: game.date,
        season: game.season,
        isHome: game.isHome
      }));
    }
    
    return Response.json({
      success: true,
      teamName: teamName,
      results: {
        currentData: currentData ? {
          found: true,
          gamesCount: currentData.games?.length || 0
        } : { found: false },
        historicalData: historicalData ? {
          found: true,
          gamesCount: historicalData.games?.length || 0,
          season: historicalData.season
        } : { found: false },
        combinedData: combinedData ? {
          found: true,
          totalGames: combinedData.games?.length || 0,
          seasons: combinedData.seasons || [],
          sampleGames: sampleGames
        } : { found: false }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}