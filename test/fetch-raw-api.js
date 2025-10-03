require('dotenv').config({ path: '.env.local' });

// Simular uma chamada à API como o dataLoader faz
async function fetchRawApiData() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const laLigaEndpoint = 'stats_season_fixtures2/130805';
    const url = `https://api.sportradar.com/soccer/statistics-soccerway/v1/seasons/${laLigaEndpoint}?api_key=${process.env.SPORTRADAR_API_KEY}`;
    
    console.log('🌐 Fazendo chamada à API SportsRadar...');
    console.log('🔗 URL:', url.replace(process.env.SPORTRADAR_API_KEY, 'API_KEY'));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://betano.pt/',
        'Origin': 'https://betano.pt'
      }
    });

    console.log('📡 Status da resposta:', response.status);
    
    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status, response.statusText);
      
      // Tentar ver os headers da resposta
      console.log('📋 Headers da resposta:');
      for (const [key, value] of response.headers) {
        console.log(`   ${key}: ${value}`);
      }
      
      const errorText = await response.text();
      console.log('📄 Corpo da resposta de erro:', errorText.substring(0, 500));
      return;
    }

    const data = await response.json();
    console.log('✅ Dados recebidos da API!');
    
    // Extrair todas as equipas únicas
    const teams = new Set();
    const teamInfo = new Map();
    
    if (data.fixtures && Array.isArray(data.fixtures)) {
      console.log(`📊 Processando ${data.fixtures.length} jogos...`);
      
      data.fixtures.forEach(match => {
        if (match.teams?.home) {
          const name = match.teams.home.name;
          const mediumname = match.teams.home.mediumname;
          teams.add(name);
          teamInfo.set(name, { name, mediumname });
        }
        if (match.teams?.away) {
          const name = match.teams.away.name;
          const mediumname = match.teams.away.mediumname;
          teams.add(name);
          teamInfo.set(name, { name, mediumname });
        }
      });
      
      console.log(`\n📋 TODAS AS EQUIPAS DA LA LIGA (${teams.size} equipas):`);
      console.log('=' .repeat(60));
      
      const sortedTeams = [...teams].sort();
      sortedTeams.forEach((teamName, index) => {
        const info = teamInfo.get(teamName);
        console.log(`${(index + 1).toString().padStart(2)}. "${teamName}"`);
        if (info.mediumname && info.mediumname !== teamName) {
          console.log(`    └─ mediumname: "${info.mediumname}"`);
        }
      });
      
      console.log('\n🔍 PROCURANDO BETIS:');
      const betisTeams = sortedTeams.filter(name => 
        name.toLowerCase().includes('betis') || 
        teamInfo.get(name).mediumname?.toLowerCase().includes('betis')
      );
      
      if (betisTeams.length > 0) {
        console.log('🎯 BETIS ENCONTRADO:');
        betisTeams.forEach(name => {
          const info = teamInfo.get(name);
          console.log(`   ✅ name: "${name}"`);
          console.log(`   ✅ mediumname: "${info.mediumname}"`);
          console.log(`   📄 Bytes do name: [${Buffer.from(name).join(', ')}]`);
        });
      } else {
        console.log('❌ Nenhuma equipa com "betis" encontrada');
      }
      
    } else {
      console.log('❌ Estrutura de dados inesperada:', Object.keys(data));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }
}

fetchRawApiData();