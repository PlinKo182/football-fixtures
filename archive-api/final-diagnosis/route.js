export async function GET() {
  try {
    console.log('🔍 DIAGNÓSTICO FINAL - Comparando SportsRadar vs Configuração...');
    
    // Testar URL atual
    const currentUrl = 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/130805';
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    const response = await fetch(currentUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extrair nomes de todas as equipas
    const allTeamNames = new Set();
    let matches = [];
    
    if (data.doc?.[0]?.data?.matches) {
      matches = data.doc[0].data.matches;
      
      matches.forEach(match => {
        if (match.teams?.home?.name) allTeamNames.add(match.teams.home.name);
        if (match.teams?.away?.name) allTeamNames.add(match.teams.away.name);
      });
    }
    
    const teamNamesArray = Array.from(allTeamNames).sort();
    
    // Nossas equipas alvo
    const ourTeams = ['Osasuna', 'Bétis', 'Atl. Bilbao'];
    
    console.log(`📊 Total de equipas na SportsRadar: ${teamNamesArray.length}`);
    console.log(`🎯 Nossas equipas alvo: ${ourTeams.join(', ')}`);
    
    // Procurar matches para nossas equipas
    const teamMatches = {};
    
    ourTeams.forEach(teamName => {
      // Buscar variações do nome
      const variations = teamNamesArray.filter(srName => 
        srName.toLowerCase().includes(teamName.toLowerCase()) ||
        teamName.toLowerCase().includes(srName.toLowerCase())
      );
      
      console.log(`🔍 ${teamName} - Variações encontradas:`, variations);
      
      // Contar jogos para cada variação
      variations.forEach(variation => {
        const matchCount = matches.filter(match => 
          match.teams?.home?.name === variation || match.teams?.away?.name === variation
        ).length;
        
        console.log(`   - "${variation}": ${matchCount} jogos`);
        
        if (!teamMatches[teamName]) teamMatches[teamName] = [];
        teamMatches[teamName].push({
          sportsRadarName: variation,
          matches: matchCount
        });
      });
    });
    
    // Procurar especificamente por termos relacionados
    const searchTerms = ['Betis', 'Bétis', 'Osasuna', 'Bilbao', 'Athletic'];
    const relatedTeams = {};
    
    searchTerms.forEach(term => {
      const related = teamNamesArray.filter(name => 
        name.toLowerCase().includes(term.toLowerCase())
      );
      if (related.length > 0) {
        relatedTeams[term] = related;
        console.log(`🔍 Termo "${term}" encontrado em:`, related);
      }
    });
    
    return Response.json({
      success: true,
      summary: {
        totalTeamsInSportsRadar: teamNamesArray.length,
        totalMatches: matches.length,
        ourTargetTeams: ourTeams
      },
      allTeamNames: teamNamesArray,
      teamMatches: teamMatches,
      relatedTeams: relatedTeams,
      firstFewMatches: matches.slice(0, 3).map(match => ({
        home: match.teams?.home?.name,
        away: match.teams?.away?.name,
        status: match.status,
        hasResult: !!(match.result?.home !== null || match.result?.away !== null)
      }))
    });

  } catch (error) {
    console.error('❌ Erro no diagnóstico final:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}