require('dotenv').config({ path: '.env.local' });

// Usar o mesmo fetch que o dataLoader
const fetchFixturesFromAPI = async (endpoint) => {
  const url = `https://api.sportradar.com/soccer/statistics-soccerway/v1/seasons/${endpoint}?api_key=${process.env.SPORTRADAR_API_KEY}`;
  
  const fetch = (await import('node-fetch')).default;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://betano.pt/',
      'Origin': 'https://betano.pt'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

async function analyzeTeamNames() {
  try {
    console.log('🔍 Analisando nomes de equipas da La Liga...');
    
    const data = await fetchFixturesFromAPI('stats_season_fixtures2/130805');
    
    const teams = new Set();
    const teamDetails = new Map();
    
    if (data.fixtures) {
      data.fixtures.forEach(match => {
        if (match.teams?.home) {
          const name = match.teams.home.name;
          const mediumname = match.teams.home.mediumname;
          teams.add(name);
          if (!teamDetails.has(name)) {
            teamDetails.set(name, { name, mediumname });
          }
        }
        if (match.teams?.away) {
          const name = match.teams.away.name;
          const mediumname = match.teams.away.mediumname;
          teams.add(name);
          if (!teamDetails.has(name)) {
            teamDetails.set(name, { name, mediumname });
          }
        }
      });
    }
    
    const sortedTeams = [...teams].sort();
    
    console.log('\n📋 Todas as equipas da La Liga (name + mediumname):');
    sortedTeams.forEach(teamName => {
      const details = teamDetails.get(teamName);
      console.log(`   "${teamName}" | "${details.mediumname}"`);
    });
    
    console.log('\n🔍 Procurando variações de Betis:');
    sortedTeams.forEach(teamName => {
      const details = teamDetails.get(teamName);
      if (teamName.toLowerCase().includes('betis') || 
          details.mediumname?.toLowerCase().includes('betis')) {
        console.log(`   ✅ ENCONTRADO: "${teamName}" | "${details.mediumname}"`);
        console.log(`      - name bytes: [${Buffer.from(teamName).join(', ')}]`);
        console.log(`      - mediumname bytes: [${Buffer.from(details.mediumname || '').join(', ')}]`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

analyzeTeamNames();