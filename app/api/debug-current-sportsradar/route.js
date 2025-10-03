export async function GET() {
  try {
    console.log('🔍 Investigando resposta da SportsRadar - ÉPOCA ATUAL...');
    
    // URL da época atual (La Liga 2025/26)
    const currentUrl = 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/130805';
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    console.log(`🌐 Fazendo request para época atual: ${currentUrl}`);
    
    const response = await fetch(currentUrl, { 
      headers,
      signal: AbortSignal.timeout(15000)
    });

    console.log(`📡 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Estrutura da resposta atual:', Object.keys(data));
    
    // Analisar estrutura
    let matches = [];
    let hasMatches = false;
    
    if (data.doc && data.doc[0] && data.doc[0].data) {
      console.log('📋 Estrutura doc[0].data:', Object.keys(data.doc[0].data));
      
      if (data.doc[0].data.matches) {
        matches = data.doc[0].data.matches;
        hasMatches = true;
        console.log(`📊 Total de jogos encontrados: ${matches.length}`);
      }
    }
    
    // Encontrar jogos do Bétis
    const betisMatches = matches.filter(match => {
      const homeName = match.teams?.home?.name || '';
      const awayName = match.teams?.away?.name || '';
      return homeName.includes('Bétis') || awayName.includes('Bétis') ||
             homeName.includes('Betis') || awayName.includes('Betis');
    }).slice(0, 3);
    
    console.log(`⚽ Jogos do Bétis encontrados: ${betisMatches.length}`);
    
    betisMatches.forEach((match, index) => {
      console.log(`\n🎮 Jogo atual ${index + 1}:`);
      console.log(`   Casa: ${match.teams?.home?.name}`);
      console.log(`   Fora: ${match.teams?.away?.name}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   UTS: ${match.time?.uts}`);
      console.log(`   Data: ${match.time?.date}`);
      console.log(`   Hora: ${match.time?.time}`);
      console.log(`   Resultado Casa: ${match.result?.home}`);
      console.log(`   Resultado Fora: ${match.result?.away}`);
      console.log(`   Match completo:`, JSON.stringify(match, null, 2));
    });
    
    // Verificar jogos com resultados
    const matchesWithResults = matches.filter(match => 
      match.result && (match.result.home !== null || match.result.away !== null)
    );
    
    console.log(`🏆 Jogos com resultados na época atual: ${matchesWithResults.length}`);
    
    return Response.json({
      success: true,
      type: 'current_season',
      url: currentUrl,
      responseStatus: response.status,
      hasValidStructure: hasMatches,
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
        hasResult: !!(match.result && (match.result.home !== null || match.result.away !== null))
      })),
      rawStructure: {
        hasDoc: !!data.doc,
        hasData: !!(data.doc && data.doc[0] && data.doc[0].data),
        hasMatches: hasMatches,
        dataKeys: data.doc && data.doc[0] && data.doc[0].data ? Object.keys(data.doc[0].data) : []
      },
      sampleMatch: matches[0] || null
    });

  } catch (error) {
    console.error('❌ Erro ao investigar época atual:', error);
    return Response.json({
      success: false,
      type: 'current_season',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}