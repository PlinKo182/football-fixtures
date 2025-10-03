require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = "https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/";

const teamsToTest = [
  { name: 'Atl. Bilbao', league: 'La Liga', endpoint: 'stats_season_fixtures2/130805' },
  { name: 'Mónaco', league: 'Ligue 1', endpoint: 'stats_season_fixtures2/131609' }
];

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

async function testProblematicTeams() {
  try {
    console.log('🔍 Testando equipas problemáticas...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.useDb('Empates');
    
    for (const teamConfig of teamsToTest) {
      console.log(`\n📋 Testando ${teamConfig.name} (${teamConfig.league}):`);
      
      // Buscar dados da API
      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Referer': 'https://www.betano.pt/',
        'Origin': 'https://www.betano.pt'
      };

      const response = await fetch(`${BASE_URL}${teamConfig.endpoint}`, { 
        headers,
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        console.log(`❌ Erro HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data && data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches) {
        const matches = data.doc[0].data.matches;
        console.log(`📊 ${matches.length} jogos na API`);
        
        // Procurar jogos da equipa
        const teamGames = [];
        let foundMatches = 0;
        
        for (const match of matches) {
          const homeTeam = match.teams?.home?.name;
          const awayTeam = match.teams?.away?.name;
          
          if (homeTeam === teamConfig.name || awayTeam === teamConfig.name) {
            foundMatches++;
            if (foundMatches <= 3) {
              console.log(`   ${foundMatches}. ${homeTeam} vs ${awayTeam}`);
            }
            
            const gameData = parseMatchForTeam(match, teamConfig.name);
            if (gameData) {
              teamGames.push(gameData);
            }
          }
        }
        
        console.log(`✅ ${foundMatches} jogos encontrados para "${teamConfig.name}"`);
        console.log(`📊 ${teamGames.length} jogos processados`);
        
        if (teamGames.length > 0) {
          // Salvar na base de dados
          const collection = teamConfig.league === 'La Liga' ? 'laliga' : 'ligue1';
          const Model = db.model(collection, new mongoose.Schema({}, { strict: false }), collection);
          
          await Model.findOneAndUpdate(
            { teamName: teamConfig.name },
            {
              teamName: teamConfig.name,
              league: teamConfig.league,
              games: teamGames,
              lastUpdated: new Date()
            },
            { upsert: true, new: true }
          );
          
          console.log(`💾 ${teamConfig.name} salvo na coleção ${collection}`);
        }
        
      } else {
        console.log('❌ Estrutura de dados inesperada');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

testProblematicTeams();