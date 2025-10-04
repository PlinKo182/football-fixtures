import { LEAGUE_MAPPINGS, TEAMS } from '../../../lib/teams.js';

// Função parseMatchForTeam copiada do dataLoader para debug
function parseMatchForTeamDebug(match, teamName, leagueName) {
  console.log(`\n🔍 PARSING MATCH para ${teamName}:`);
  
  const homeTeam = match.teams?.home?.name;
  const awayTeam = match.teams?.away?.name;
  
  console.log(`   Home: "${homeTeam}"`);
  console.log(`   Away: "${awayTeam}"`);
  
  if (!homeTeam || !awayTeam) {
    console.log(`   ❌ Sem nomes de equipas válidos`);
    return null;
  }

  // Verificar matching
  const isHome = homeTeam === teamName || 
                 (teamName === 'Bétis' && homeTeam?.includes('Bétis')) ||
                 (teamName === 'Atl. Bilbao' && (homeTeam?.includes('Athletic') || homeTeam?.includes('Bilbao'))) ||
                 (teamName === 'Osasuna' && homeTeam?.includes('Osasuna'));
                 
  const isAway = awayTeam === teamName || 
                 (teamName === 'Bétis' && awayTeam?.includes('Bétis')) ||
                 (teamName === 'Atl. Bilbao' && (awayTeam?.includes('Athletic') || awayTeam?.includes('Bilbao'))) ||
                 (teamName === 'Osasuna' && awayTeam?.includes('Osasuna'));
  
  console.log(`   isHome: ${isHome}`);
  console.log(`   isAway: ${isAway}`);
  
  if (!isHome && !isAway) {
    console.log(`   ❌ Não envolve ${teamName}`);
    return null;
  }

  // Parse da data/hora
  let fixtureDate;
  if (match.time?.uts) {
    fixtureDate = new Date(match.time.uts * 1000);
    console.log(`   Data (UTS): ${fixtureDate.toISOString()}`);
  } else if (match.time?.date && match.time?.time) {
    const dateStr = `${match.time.date} ${match.time.time}`;
    fixtureDate = new Date(dateStr + ' GMT+0100');
    console.log(`   Data (string): ${fixtureDate.toISOString()}`);
  } else {
    fixtureDate = new Date();
    console.log(`   Data (fallback): ${fixtureDate.toISOString()}`);
  }
  
  // Determinar adversário e resultados
  const opponent = isHome ? awayTeam : homeTeam;
  const teamScore = isHome ? match.result?.home : match.result?.away;
  const opponentScore = isHome ? match.result?.away : match.result?.home;
  
  console.log(`   Adversário: "${opponent}"`);
  console.log(`   teamScore: ${teamScore}`);
  console.log(`   opponentScore: ${opponentScore}`);
  console.log(`   Status original: "${match.status}"`);
  
  const status = match.status === 'ended' ? 'finished' : 
                 match.status === 'live' ? 'live' : 
                 match.postponed || match.canceled || match.status === 'Adiado' ? 'postponed' : 'scheduled';
  
  console.log(`   Status final: "${status}"`);
  
  const parsed = {
    opponent,
    isHome,
    date: fixtureDate,
    status,
    teamScore,
    opponentScore,
    sportRadarId: match._id?.toString()
  };
  
  console.log(`   ✅ Jogo processado:`, JSON.stringify(parsed, null, 2));
  
  return parsed;
}

export async function GET() {
  try {
    console.log('🔍 Testando processamento de dados da SportsRadar...');
    
    // Buscar dados da La Liga
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
      return Response.json({
        success: false,
        message: 'Sem dados de jogos na resposta'
      });
    }
    
    const matches = data.doc[0].data.matches;
    
    console.log(`📊 Processando ${matches.length} jogos...`);
    
    // Testar processamento para cada equipa alvo
    const laLigaTeams = ['Bétis', 'Atl. Bilbao', 'Osasuna'];
    const results = {};
    
    for (const teamName of laLigaTeams) {
      console.log(`\n🏟️  PROCESSANDO ${teamName}:`);
      
      results[teamName] = {
        processedGames: [],
        totalMatches: 0,
        relevantMatches: 0
      };
      
      matches.forEach((match, index) => {
        const parsed = parseMatchForTeamDebug(match, teamName, 'La Liga');
        if (parsed) {
          results[teamName].processedGames.push(parsed);
          results[teamName].relevantMatches++;
        }
        results[teamName].totalMatches++;
      });
      
      console.log(`\n📊 RESUMO ${teamName}:`);
      console.log(`   Total analisados: ${results[teamName].totalMatches}`);
      console.log(`   Jogos relevantes: ${results[teamName].relevantMatches}`);
      console.log(`   Jogos processados: ${results[teamName].processedGames.length}`);
    }
    
    return Response.json({
      success: true,
      totalMatches: matches.length,
      processingResults: Object.keys(results).map(team => ({
        team: team,
        totalAnalyzed: results[team].totalMatches,
        relevantMatches: results[team].relevantMatches,
        processedGames: results[team].processedGames.length,
        sampleGames: results[team].processedGames.slice(0, 2)
      }))
    });

  } catch (error) {
    console.error('❌ Erro no teste de processamento:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}