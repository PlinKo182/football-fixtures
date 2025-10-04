export async function GET() {
  try {
    console.log('🔍 Testando URL histórica da SportsRadar...');
    
    const historicalUrl = 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/118691';
    
    const response = await fetch(historicalUrl, {
      headers: {
        'Referer': 'https://www.betano.pt/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Estrutura da resposta:', Object.keys(data));
    
    // Encontrar jogos com resultados
    let matches = [];
    let matchesWithResults = [];
    
    if (data.doc && data.doc[0] && data.doc[0].data) {
      if (data.doc[0].data.matches) {
        matches = data.doc[0].data.matches;
      } else if (data.doc[0].data.tournament && data.doc[0].data.tournament.matches) {
        matches = data.doc[0].data.tournament.matches;
      }
    }
    
    console.log(`📊 Total de jogos encontrados: ${matches.length}`);
    
    // Filtrar jogos com resultados
    matchesWithResults = matches.filter(match => 
      match.result && match.result.current && 
      (match.result.current.home !== null || match.result.current.away !== null)
    );
    
    console.log(`🏆 Jogos com resultados: ${matchesWithResults.length}`);
    
    // Pegar uma amostra de jogos do Bétis
    const betisMatches = matches.filter(match => 
      match.teams && (
        match.teams.home?.name === 'Bétis' || match.teams.home?.name === 'Real Bétis' ||
        match.teams.away?.name === 'Bétis' || match.teams.away?.name === 'Real Bétis'
      )
    ).slice(0, 5);
    
    console.log(`⚽ Jogos do Bétis encontrados: ${betisMatches.length}`);
    
    betisMatches.forEach((match, index) => {
      console.log(`\n🎮 Jogo histórico ${index + 1}:`);
      console.log(`   Casa: ${match.teams?.home?.name}`);
      console.log(`   Fora: ${match.teams?.away?.name}`);
      console.log(`   Data: ${match.time?.date}`);
      console.log(`   Resultado Casa: ${match.result?.current?.home}`);
      console.log(`   Resultado Fora: ${match.result?.current?.away}`);
      console.log(`   Status: ${match.status || 'finished'}`);
    });
    
    return Response.json({
      success: true,
      url: historicalUrl,
      totalMatches: matches.length,
      matchesWithResults: matchesWithResults.length,
      betisMatches: betisMatches.map(match => ({
        homeTeam: match.teams?.home?.name,
        awayTeam: match.teams?.away?.name,
        date: match.time?.date,
        homeScore: match.result?.current?.home,
        awayScore: match.result?.current?.away,
        hasResult: !!(match.result?.current?.home !== null || match.result?.current?.away !== null)
      })),
      sampleData: matches.slice(0, 2) // Primeiro jogo completo para análise
    });

  } catch (error) {
    console.error('❌ Erro ao testar URL histórica:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}