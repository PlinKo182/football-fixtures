export async function GET() {
  try {
    console.log('🔍 Testando dados da SportsRadar para época 2024-25...');
    
    const url = 'https://eu-offering-api.kambicdn.com/offering/v2018/kambi/listView/football/spain/la_liga.json?lang=pt_BR&market=BR&client_id=2&channel_id=1&ncid=1638782649&useCombined=true&category=competitions&subcategory=matches&sort=match_time_ut&includeParticipants=true';
    
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://www.betano.pt/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches) {
      const matches = data.doc[0].data.matches;
      
      // Encontrar jogos do Bétis
      const betisMatches = matches.filter(match => 
        match.teams.home.name === 'Bétis' || match.teams.away.name === 'Bétis'
      ).slice(0, 5);
      
      console.log(`📊 Total de jogos encontrados: ${matches.length}`);
      console.log(`⚽ Jogos do Bétis encontrados: ${betisMatches.length}`);
      
      betisMatches.forEach((match, index) => {
        console.log(`\n🎮 Jogo da SportsRadar ${index + 1}:`);
        console.log(`   Casa: ${match.teams.home.name}`);
        console.log(`   Fora: ${match.teams.away.name}`);
        console.log(`   Data: ${match.time?.date}`);
        console.log(`   Hora: ${match.time?.time}`);
        console.log(`   Status: ${match.result?.current ? 'finished' : 'scheduled'}`);
        console.log(`   Resultado Casa: ${match.result?.current?.home}`);
        console.log(`   Resultado Fora: ${match.result?.current?.away}`);
        console.log(`   Match completo:`, JSON.stringify(match, null, 2));
      });
      
      return Response.json({
        success: true,
        totalMatches: matches.length,
        betisMatches: betisMatches.map(match => ({
          homeTeam: match.teams.home.name,
          awayTeam: match.teams.away.name,
          date: match.time?.date,
          time: match.time?.time,
          homeScore: match.result?.current?.home,
          awayScore: match.result?.current?.away,
          hasResult: !!match.result?.current
        }))
      });
    }
    
    return Response.json({
      success: false,
      message: 'Estrutura de dados inesperada',
      data: data
    });

  } catch (error) {
    console.error('❌ Erro ao testar SportsRadar:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}