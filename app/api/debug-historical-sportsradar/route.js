export async function GET() {
  try {
    console.log('🔍 Investigando resposta da SportsRadar - ÉPOCA HISTÓRICA...');
    
    // URL da época histórica (La Liga 2024/25)
    const historicalUrl = 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/118691';
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    console.log(`🌐 Fazendo request para época histórica: ${historicalUrl}`);
    
    const response = await fetch(historicalUrl, { 
      headers,
      signal: AbortSignal.timeout(15000)
    });

    console.log(`📡 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Estrutura da resposta histórica:', Object.keys(data));
    
    // Analisar estrutura
    let matches = [];
    let hasMatches = false;
    
    if (data.doc && data.doc[0] && data.doc[0].data) {
      console.log('📋 Estrutura doc[0].data histórica:', Object.keys(data.doc[0].data));
      
      if (data.doc[0].data.matches) {
        matches = data.doc[0].data.matches;
        hasMatches = true;
        console.log(`📊 Total de jogos históricos encontrados: ${matches.length}`);
      }
    }
    
    // Encontrar jogos do Bétis
    const betisMatches = matches.filter(match => {
      const homeName = match.teams?.home?.name || '';
      const awayName = match.teams?.away?.name || '';
      return homeName.includes('Bétis') || awayName.includes('Bétis') ||
             homeName.includes('Betis') || awayName.includes('Betis');
    }).slice(0, 3);
    
    console.log(`⚽ Jogos históricos do Bétis encontrados: ${betisMatches.length}`);
    
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
      console.log(`   Match completo:`, JSON.stringify(match, null, 2));
    });
    
    // Verificar jogos com resultados
    const matchesWithResults = matches.filter(match => 
      match.result && (match.result.home !== null || match.result.away !== null)
    );
    
    console.log(`🏆 Jogos com resultados na época histórica: ${matchesWithResults.length}`);
    
    // Verificar todos os nomes de equipas para ver se "Bétis" existe
    const allTeamNames = new Set();
    matches.forEach(match => {
      if (match.teams?.home?.name) allTeamNames.add(match.teams.home.name);
      if (match.teams?.away?.name) allTeamNames.add(match.teams.away.name);
    });
    
    const teamNamesArray = Array.from(allTeamNames).sort();
    console.log(`🏟️  Todas as equipas encontradas: ${teamNamesArray.length}`);
    
    // Procurar variações do nome Bétis
    const betisVariations = teamNamesArray.filter(name => 
      name.toLowerCase().includes('betis') || 
      name.toLowerCase().includes('bétis')
    );
    
    console.log(`🔍 Variações do Bétis encontradas:`, betisVariations);
    
    return Response.json({
      success: true,
      type: 'historical_season',
      url: historicalUrl,
      responseStatus: response.status,
      hasValidStructure: hasMatches,
      totalMatches: matches.length,
      matchesWithResults: matchesWithResults.length,
      betisMatchesCount: betisMatches.length,
      betisVariations: betisVariations,
      allTeamNames: teamNamesArray.slice(0, 20), // Primeiras 20 equipas
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
    console.error('❌ Erro ao investigar época histórica:', error);
    return Response.json({
      success: false,
      type: 'historical_season',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}