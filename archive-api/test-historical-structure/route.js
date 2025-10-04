export async function GET() {
  try {
    console.log('🔍 Testando URL histórica com parsing correto...');
    
    const historicalUrl = 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/118691';
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    const response = await fetch(historicalUrl, { 
      headers,
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Estrutura da resposta:', Object.keys(data));
    
    // Usar a mesma estrutura do dataLoader
    let matches = [];
    
    if (data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches) {
      matches = data.doc[0].data.matches;
      console.log(`📊 Total de jogos encontrados: ${matches.length}`);
      
      // Encontrar jogos do Bétis
      const betisMatches = matches.filter(match => 
        match.teams?.home?.name === 'Bétis' || match.teams?.away?.name === 'Bétis' ||
        match.teams?.home?.name === 'Real Bétis' || match.teams?.away?.name === 'Real Bétis'
      ).slice(0, 5);
      
      console.log(`⚽ Jogos do Bétis encontrados: ${betisMatches.length}`);
      
      betisMatches.forEach((match, index) => {
        console.log(`\n🎮 Jogo histórico ${index + 1}:`);
        console.log(`   Casa: ${match.teams?.home?.name}`);
        console.log(`   Fora: ${match.teams?.away?.name}`);
        console.log(`   Status: ${match.status}`);
        console.log(`   UTS: ${match.time?.uts}`);
        console.log(`   Data: ${match.time?.date}`);
        console.log(`   Hora: ${match.time?.time}`);
        console.log(`   Resultado Casa: ${match.result?.home}`);
        console.log(`   Resultado Fora: ${match.result?.away}`);
        console.log(`   ID: ${match._id}`);
      });
      
      // Verificar se há jogos com resultados
      const matchesWithResults = matches.filter(match => 
        match.result && (match.result.home !== null || match.result.away !== null)
      );
      
      console.log(`🏆 Total de jogos com resultados: ${matchesWithResults.length}`);
      
      return Response.json({
        success: true,
        url: historicalUrl,
        totalMatches: matches.length,
        matchesWithResults: matchesWithResults.length,
        betisMatchesCount: betisMatches.length,
        betisMatches: betisMatches.map(match => ({
          homeTeam: match.teams?.home?.name,
          awayTeam: match.teams?.away?.name,
          date: match.time?.date,
          time: match.time?.time,
          uts: match.time?.uts,
          homeScore: match.result?.home,
          awayScore: match.result?.away,
          status: match.status,
          hasResult: !!(match.result?.home !== null || match.result?.away !== null)
        })),
        structure: {
          hasDoc: !!data.doc,
          hasData: !!(data.doc && data.doc[0] && data.doc[0].data),
          hasMatches: !!(data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches)
        }
      });
    }
    
    return Response.json({
      success: false,
      message: 'Estrutura de dados inesperada',
      structure: Object.keys(data),
      hasDoc: !!data.doc,
      data: data
    });

  } catch (error) {
    console.error('❌ Erro ao testar URL histórica:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}