import { LEAGUE_MAPPINGS } from '../../../lib/teams.js';

export async function GET() {
  try {
    console.log('🔍 Investigando STATUS vs RESULTADOS na SportsRadar...');
    
    const laLigaEndpoint = LEAGUE_MAPPINGS['La Liga'].endpoint;
    const url = `https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/${laLigaEndpoint}`;
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    const response = await fetch(url, { headers });
    const data = await response.json();
    
    if (!data.doc?.[0]?.data?.matches) {
      return Response.json({ success: false, message: 'Sem dados' });
    }
    
    const matches = data.doc[0].data.matches;
    
    // Encontrar jogos com resultados
    const matchesWithResults = matches.filter(match => 
      match.result && (match.result.home !== null || match.result.away !== null)
    ).slice(0, 10);
    
    console.log(`🎯 Jogos com resultados encontrados: ${matchesWithResults.length}`);
    
    const statusAnalysis = matchesWithResults.map((match, index) => {
      console.log(`\n🎮 JOGO ${index + 1}:`);
      console.log(`   ${match.teams?.home?.name} ${match.result?.home}-${match.result?.away} ${match.teams?.away?.name}`);
      console.log(`   Status original: "${match.status}"`);
      console.log(`   Postponed: ${match.postponed}`);
      console.log(`   Canceled: ${match.canceled}`);
      console.log(`   Tem resultado: ${!!(match.result?.home !== null || match.result?.away !== null)}`);
      
      // Como o nosso código processaria o status
      const processedStatus = match.status === 'ended' ? 'finished' : 
                              match.status === 'live' ? 'live' : 
                              match.postponed || match.canceled || match.status === 'Adiado' ? 'postponed' : 'scheduled';
      
      console.log(`   Status processado: "${processedStatus}"`);
      console.log(`   PROBLEMA: Tem resultado mas status é "${processedStatus}"`);
      
      return {
        homeTeam: match.teams?.home?.name,
        awayTeam: match.teams?.away?.name,
        homeScore: match.result?.home,
        awayScore: match.result?.away,
        originalStatus: match.status,
        processedStatus: processedStatus,
        hasResult: !!(match.result?.home !== null || match.result?.away !== null),
        shouldBeFinished: !!(match.result?.home !== null || match.result?.away !== null) && processedStatus !== 'finished'
      };
    });
    
    // Contar problemas
    const problemGames = statusAnalysis.filter(game => game.shouldBeFinished);
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   Total jogos com resultados: ${statusAnalysis.length}`);
    console.log(`   Jogos com status incorreto: ${problemGames.length}`);
    
    return Response.json({
      success: true,
      totalMatchesWithResults: statusAnalysis.length,
      problemGames: problemGames.length,
      statusAnalysis: statusAnalysis,
      recommendation: problemGames.length > 0 ? 
        'Corrigir lógica de status: jogos com resultados devem ser "finished"' : 
        'Status está correto'
    });

  } catch (error) {
    console.error('❌ Erro na investigação de status:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}