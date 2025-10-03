require('dotenv').config({ path: '.env.local' });
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function showAllLaLigaTeams() {
  try {
    console.log('🔍 Buscando TODOS os nomes das equipas da La Liga no SportsRadar...\n');
    
    // Usar exatamente o mesmo endpoint e headers do dataLoader
    const BASE_URL = "https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/";
    const endpoint = 'stats_season_fixtures2/130805'; // La Liga
    const url = `${BASE_URL}${endpoint}`;
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };
    
    console.log('🌐 URL:', url);
    console.log('📋 Headers:', headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📊 Estrutura dos dados:', Object.keys(data));
    
    // Coletar todos os nomes únicos - usando a estrutura correta do dataLoader
    const allTeams = new Map(); // name -> {name, mediumname, count}
    
    if (data && data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches) {
      const matches = data.doc[0].data.matches;
      console.log(`📊 ${matches.length} jogos encontrados`);
      
      matches.forEach(match => {
        // Time casa
        if (match.teams?.home) {
          const name = match.teams.home.name;
          const mediumname = match.teams.home.mediumname;
          if (!allTeams.has(name)) {
            allTeams.set(name, { name, mediumname, count: 0 });
          }
          allTeams.get(name).count++;
        }
        
        // Time visitante
        if (match.teams?.away) {
          const name = match.teams.away.name;
          const mediumname = match.teams.away.mediumname;
          if (!allTeams.has(name)) {
            allTeams.set(name, { name, mediumname, count: 0 });
          }
          allTeams.get(name).count++;
        }
      });
    } else {
      console.log('❌ Estrutura de dados inesperada');
      console.log('Dados recebidos:', JSON.stringify(data, null, 2).substring(0, 500));
    }
    
    // Ordenar por nome
    const sortedTeams = [...allTeams.values()].sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('📋 TODAS AS EQUIPAS DA LA LIGA no SportsRadar:');
    console.log('   (formato: "name" | "mediumname" | jogos)\n');
    
    sortedTeams.forEach((team, index) => {
      const num = (index + 1).toString().padStart(2, '0');
      console.log(`${num}. "${team.name}" | "${team.mediumname}" | ${team.count} jogos`);
    });
    
    console.log(`\n📊 Total: ${sortedTeams.length} equipas encontradas`);
    
    // Procurar especificamente por Betis
    console.log('\n🔍 PROCURANDO POR "BETIS":');
    const betisTeams = sortedTeams.filter(team => 
      team.name.toLowerCase().includes('betis') || 
      team.mediumname.toLowerCase().includes('betis')
    );
    
    if (betisTeams.length > 0) {
      betisTeams.forEach(team => {
        console.log(`   ✅ ENCONTRADO: "${team.name}" | "${team.mediumname}"`);
        console.log(`      - Usar no teams.js: '${team.name}'`);
      });
    } else {
      console.log('   ❌ Nenhuma equipa com "Betis" encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.message.includes('403')) {
      console.log('\n💡 Dica: Erro 403 significa que a API rejeitou o pedido.');
      console.log('   Isso pode acontecer por rate limiting ou headers incorretos.');
    }
  }
}

showAllLaLigaTeams();