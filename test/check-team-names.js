const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: '.env.local' });

async function checkTeamNames() {
  try {
    const laLigaEndpoint = 'stats_season_fixtures2/130805';
    const url = `https://api.sportradar.com/soccer/statistics-soccerway/v1/seasons/${laLigaEndpoint}?api_key=${process.env.SPORTRADAR_API_KEY}`;
    
    console.log('🔍 Buscando nomes das equipas da La Liga na API...');
    
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

    const data = await response.json();
    
    // Extrair nomes únicos das equipas
    const teamNames = new Set();
    
    if (data.fixtures) {
      data.fixtures.forEach(match => {
        if (match.teams?.home?.name) {
          teamNames.add(match.teams.home.name);
        }
        if (match.teams?.away?.name) {
          teamNames.add(match.teams.away.name);
        }
      });
    }
    
    const sortedTeams = Array.from(teamNames).sort();
    
    console.log('\n📋 Equipas encontradas na La Liga:');
    sortedTeams.forEach(team => {
      console.log(`   - ${team}`);
    });
    
    // Procurar por Betis especificamente
    console.log('\n🔍 Procurando por "Betis":');
    const betisTeams = sortedTeams.filter(team => 
      team.toLowerCase().includes('betis')
    );
    
    if (betisTeams.length > 0) {
      console.log('✅ Encontrado:');
      betisTeams.forEach(team => {
        console.log(`   - "${team}"`);
      });
    } else {
      console.log('❌ Nenhuma equipa com "Betis" encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkTeamNames();