import { TEAMS, getLeagueByTeam } from '../../../lib/teams.js';
import { getTeamGamesOptimized } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Testando mapeamento de equipas...');
    
    console.log('📋 Equipas configuradas:', TEAMS);
    
    // Testar cada equipa da La Liga
    const laLigaTeams = ['Osasuna', 'Bétis', 'Atl. Bilbao'];
    
    const results = [];
    
    for (const teamName of laLigaTeams) {
      console.log(`\n🔍 Testando: ${teamName}`);
      
      // Verificar mapeamento da liga
      const league = getLeagueByTeam(teamName);
      console.log(`   - Liga mapeada: ${league}`);
      
      // Tentar buscar dados
      const teamData = await getTeamGamesOptimized(teamName);
      console.log(`   - Dados encontrados: ${teamData ? 'Sim' : 'Não'}`);
      
      if (teamData) {
        console.log(`   - Jogos: ${teamData.games?.length || 0}`);
      }
      
      results.push({
        teamName,
        league,
        hasData: !!teamData,
        games: teamData?.games?.length || 0
      });
    }
    
    console.log('\n📊 Resumo dos testes:', results);
    
    return Response.json({
      success: true,
      configuredTeams: TEAMS,
      laLigaTeams: laLigaTeams,
      testResults: results
    });

  } catch (error) {
    console.error('❌ Erro no teste de mapeamento:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}