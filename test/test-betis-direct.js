require('dotenv').config({ path: '.env.local' });

// Importar tudo que precisamos
const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = "https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/";

const LEAGUE_MAPPINGS = {
  'La Liga': {
    name: 'La Liga',
    endpoint: 'stats_season_fixtures2/130805',
    teams: ['Osasuna', 'Bétis', 'Atl. Bilbao']
  }
};

async function fetchFixturesFromAPI(leagueEndpoint) {
  try {
    console.log(`🌐 Buscando: ${BASE_URL}${leagueEndpoint}`);
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    const response = await fetch(`${BASE_URL}${leagueEndpoint}`, { 
      headers,
      signal: AbortSignal.timeout(15000)
    });
    
    console.log(`📡 Status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Erro API:', error.message);
    throw error;
  }
}

function parseMatchForTeam(match, teamName) {
  const homeTeam = match.teams?.home?.name;
  const awayTeam = match.teams?.away?.name;
  
  if (!homeTeam || !awayTeam) {
    return null;
  }

  const isHome = homeTeam === teamName;
  const isAway = awayTeam === teamName;
  
  if (!isHome && !isAway) {
    return null;
  }

  return {
    opponent: isHome ? awayTeam : homeTeam,
    date: new Date(match.start_time),
    location: isHome ? 'home' : 'away',
    time: new Date(match.start_time).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Lisbon'
    })
  };
}

async function testBetisDirectly() {
  try {
    console.log('🔍 Testando Bétis diretamente...\n');
    
    // Conectar à base de dados
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.useDb('Empates');
    const LaLigaModel = db.model('LaLiga', new mongoose.Schema({}, { strict: false }), 'laliga');
    
    // Limpar dados existentes
    await LaLigaModel.deleteMany({});
    console.log('🗑️  La Liga limpa');
    
    // Buscar dados da API
    const data = await fetchFixturesFromAPI('stats_season_fixtures2/130805');
    
    if (data && data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches) {
      const matches = data.doc[0].data.matches;
      console.log(`📊 ${matches.length} jogos encontrados`);
      
      // Testar especificamente o Bétis
      const teamName = 'Bétis';
      console.log(`\n🔍 Procurando jogos de "${teamName}"...`);
      
      const teamGames = [];
      let foundMatches = 0;
      
      for (const match of matches) {
        const homeTeam = match.teams?.home?.name;
        const awayTeam = match.teams?.away?.name;
        
        if (homeTeam === teamName || awayTeam === teamName) {
          foundMatches++;
          console.log(`   ${foundMatches}. ${homeTeam} vs ${awayTeam}`);
          
          const gameData = parseMatchForTeam(match, teamName);
          if (gameData) {
            teamGames.push(gameData);
          }
        }
      }
      
      console.log(`\n✅ ${foundMatches} jogos encontrados para ${teamName}`);
      console.log(`📊 ${teamGames.length} jogos processados`);
      
      if (teamGames.length > 0) {
        // Salvar na base de dados
        await LaLigaModel.create({
          teamName,
          league: 'La Liga',
          games: teamGames,
          lastUpdated: new Date()
        });
        
        console.log(`💾 ${teamName} salvo na base de dados com ${teamGames.length} jogos`);
      }
      
    } else {
      console.log('❌ Estrutura de dados inesperada');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

testBetisDirectly();