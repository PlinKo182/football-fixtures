import { LEAGUE_MAPPINGS } from '../../../lib/teams.js';

export async function GET() {
  try {
    console.log('🔍 Investigando dados brutos vs processados da SportsRadar...');
    
    // Testar La Liga atual
    const laLigaEndpoint = LEAGUE_MAPPINGS['La Liga'].endpoint;
    const url = `https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/${laLigaEndpoint}`;
    
    console.log(`🌐 URL: ${url}`);
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📊 Estrutura da resposta:', Object.keys(data));
    
    let matches = [];
    let rawMatches = [];
    
    if (data.doc?.[0]?.data?.matches) {
      rawMatches = data.doc[0].data.matches;
      matches = rawMatches.slice(0, 5); // Primeiros 5 jogos para análise
      
      console.log(`📊 Total de jogos na resposta: ${rawMatches.length}`);
      console.log(`🔍 Analisando primeiros ${matches.length} jogos...`);
    }
    
    // Analisar estrutura de cada jogo
    const analyzedMatches = matches.map((match, index) => {
      console.log(`\n🎮 JOGO ${index + 1}:`);
      console.log(`   Home: ${match.teams?.home?.name}`);
      console.log(`   Away: ${match.teams?.away?.name}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Time: ${JSON.stringify(match.time)}`);
      console.log(`   Result: ${JSON.stringify(match.result)}`);
      console.log(`   ID: ${match._id}`);
      console.log(`   Postponed: ${match.postponed}`);
      console.log(`   Canceled: ${match.canceled}`);
      
      return {
        index: index + 1,
        homeTeam: match.teams?.home?.name,
        awayTeam: match.teams?.away?.name,
        status: match.status,
        time: match.time,
        result: match.result,
        id: match._id,
        postponed: match.postponed,
        canceled: match.canceled,
        fullMatch: match // Incluir objeto completo para análise
      };
    });
    
    // Procurar jogos com Bétis/Athletic/Osasuna
    const targetTeams = ['Bétis', 'Athletic', 'Osasuna'];
    const relevantMatches = rawMatches.filter(match => {
      const homeName = match.teams?.home?.name || '';
      const awayName = match.teams?.away?.name || '';
      
      return targetTeams.some(team => 
        homeName.includes(team) || awayName.includes(team)
      );
    }).slice(0, 3);
    
    console.log(`\n🎯 Jogos das equipas alvo encontrados: ${relevantMatches.length}`);
    
    relevantMatches.forEach((match, index) => {
      console.log(`\n⚽ JOGO ALVO ${index + 1}:`);
      console.log(`   ${match.teams?.home?.name} vs ${match.teams?.away?.name}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Resultado: ${match.result?.home}-${match.result?.away}`);
      console.log(`   Data: ${match.time?.date} ${match.time?.time}`);
      console.log(`   UTS: ${match.time?.uts}`);
    });
    
    return Response.json({
      success: true,
      url: url,
      totalMatches: rawMatches.length,
      analyzedMatches: analyzedMatches,
      relevantMatches: relevantMatches.map(match => ({
        homeTeam: match.teams?.home?.name,
        awayTeam: match.teams?.away?.name,
        status: match.status,
        homeScore: match.result?.home,
        awayScore: match.result?.away,
        date: match.time?.date,
        time: match.time?.time,
        uts: match.time?.uts,
        hasResult: match.result && (match.result.home !== null || match.result.away !== null)
      })),
      rawStructure: {
        hasDoc: !!data.doc,
        hasData: !!(data.doc?.[0]?.data),
        hasMatches: !!(data.doc?.[0]?.data?.matches),
        dataKeys: data.doc?.[0]?.data ? Object.keys(data.doc[0].data) : []
      }
    });

  } catch (error) {
    console.error('❌ Erro na investigação:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}