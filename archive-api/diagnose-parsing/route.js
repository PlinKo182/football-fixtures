import { LEAGUE_MAPPINGS } from '../../../lib/teams.js';

export async function GET() {
  try {
    console.log('🔍 DIAGNÓSTICO: SportsRadar RAW vs Processamento...');
    
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
    
    // Encontrar jogos do Bétis
    const betisMatches = matches.filter(match => {
      const homeName = match.teams?.home?.name || '';
      const awayName = match.teams?.away?.name || '';
      return homeName.includes('Bétis') || awayName.includes('Bétis');
    }).slice(0, 3);
    
    console.log(`🎯 Jogos do Bétis encontrados: ${betisMatches.length}`);
    
    const analysis = betisMatches.map((match, index) => {
      console.log(`\n🎮 ANÁLISE JOGO ${index + 1}:`);
      console.log(`   Home: "${match.teams?.home?.name}"`);
      console.log(`   Away: "${match.teams?.away?.name}"`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Result object:`, JSON.stringify(match.result, null, 2));
      console.log(`   Time object:`, JSON.stringify(match.time, null, 2));
      
      // Simular o que o nosso parsing faria
      const homeTeam = match.teams?.home?.name;
      const awayTeam = match.teams?.away?.name;
      
      // Verificar se é casa ou fora para o Bétis
      const isBetisHome = homeTeam?.includes('Bétis');
      const isBetisAway = awayTeam?.includes('Bétis');
      
      console.log(`   Bétis é casa: ${isBetisHome}`);
      console.log(`   Bétis é fora: ${isBetisAway}`);
      
      // Como o nosso código parsearia os resultados
      const teamScore = isBetisHome ? match.result?.home : match.result?.away;
      const opponentScore = isBetisHome ? match.result?.away : match.result?.home;
      
      console.log(`   teamScore (parsed): ${teamScore}`);
      console.log(`   opponentScore (parsed): ${opponentScore}`);
      console.log(`   result.home: ${match.result?.home}`);
      console.log(`   result.away: ${match.result?.away}`);
      
      // Parse de data
      let fixtureDate;
      if (match.time?.uts) {
        fixtureDate = new Date(match.time.uts * 1000);
        console.log(`   Data (UTS): ${fixtureDate.toISOString()}`);
      } else if (match.time?.date && match.time?.time) {
        const dateStr = `${match.time.date} ${match.time.time}`;
        fixtureDate = new Date(dateStr + ' GMT+0100');
        console.log(`   Data (string): ${fixtureDate.toISOString()}`);
      }
      
      // Status parsing
      const status = match.status === 'ended' ? 'finished' : 
                     match.status === 'live' ? 'live' : 
                     match.postponed || match.canceled || match.status === 'Adiado' ? 'postponed' : 'scheduled';
      
      console.log(`   Status original: "${match.status}"`);
      console.log(`   Status processado: "${status}"`);
      
      return {
        raw: {
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          status: match.status,
          resultHome: match.result?.home,
          resultAway: match.result?.away,
          timeUts: match.time?.uts,
          timeDate: match.time?.date,
          timeTime: match.time?.time
        },
        processed: {
          opponent: isBetisHome ? awayTeam : homeTeam,
          isHome: isBetisHome,
          teamScore: teamScore,
          opponentScore: opponentScore,
          date: fixtureDate?.toISOString(),
          status: status
        },
        hasResult: !!(match.result && (match.result.home !== null || match.result.away !== null)),
        hasValidScores: teamScore !== null && opponentScore !== null
      };
    });
    
    return Response.json({
      success: true,
      betisMatchesFound: betisMatches.length,
      analysis: analysis,
      summary: {
        matchesWithResults: analysis.filter(a => a.hasResult).length,
        matchesWithValidScores: analysis.filter(a => a.hasValidScores).length
      }
    });

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}