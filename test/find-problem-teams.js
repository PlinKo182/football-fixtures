require('dotenv').config({ path: '.env.local' });
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = "https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/";

const leagues = [
  {
    name: 'La Liga',
    endpoint: 'stats_season_fixtures2/130805',
    searchTeams: ['Atl. Bilbao', 'Athletic', 'Bilbao']
  },
  {
    name: 'Ligue 1', 
    endpoint: 'stats_season_fixtures2/131609',
    searchTeams: ['Monaco', 'Mónaco']
  }
];

async function findCorrectTeamNames() {
  try {
    console.log('🔍 Procurando nomes corretos das equipas problemáticas...\n');
    
    for (const league of leagues) {
      console.log(`📋 ${league.name}:`);
      console.log(`🌐 Endpoint: ${league.endpoint}`);
      
      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Referer': 'https://www.betano.pt/',
        'Origin': 'https://www.betano.pt'
      };

      const response = await fetch(`${BASE_URL}${league.endpoint}`, { 
        headers,
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        console.log(`❌ Erro HTTP ${response.status} para ${league.name}\n`);
        continue;
      }
      
      const data = await response.json();
      
      if (data && data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches) {
        const matches = data.doc[0].data.matches;
        console.log(`📊 ${matches.length} jogos encontrados`);
        
        // Coletar todas as equipas
        const allTeams = new Set();
        matches.forEach(match => {
          if (match.teams?.home?.name) allTeams.add(match.teams.home.name);
          if (match.teams?.away?.name) allTeams.add(match.teams.away.name);
        });
        
        const sortedTeams = [...allTeams].sort();
        
        console.log(`\n🔍 Procurando por: ${league.searchTeams.join(', ')}`);
        
        // Procurar pelos nomes das equipas
        let found = false;
        for (const searchTerm of league.searchTeams) {
          const matches = sortedTeams.filter(team => 
            team.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          if (matches.length > 0) {
            found = true;
            console.log(`✅ Encontrado para "${searchTerm}":`);
            matches.forEach(team => {
              console.log(`   - "${team}"`);
            });
          }
        }
        
        if (!found) {
          console.log('❌ Nenhuma correspondência encontrada');
          console.log('📋 Todas as equipas disponíveis:');
          sortedTeams.forEach(team => {
            console.log(`   - "${team}"`);
          });
        }
        
      } else {
        console.log('❌ Estrutura de dados inesperada');
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

findCorrectTeamNames();