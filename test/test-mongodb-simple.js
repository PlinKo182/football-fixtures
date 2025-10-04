// Teste MongoDB com CommonJS
const mongoose = require('mongoose');

// Definir variável diretamente
process.env.MONGODB_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Empates?retryWrites=true&w=majority&appName=Cluster0';

async function testMongoDB() {
  console.log('🧪 TESTE DIRECTO MONGODB');
  console.log('═'.repeat(40));
  
  try {
    // Conectar
    console.log('🔌 Conectando...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado!');
    
    // Schema simples para Game
    const GameSchema = new mongoose.Schema({
      league: String,
      homeTeam: String, 
      awayTeam: String,
      date: Date,
      homeScore: Number,
      awayScore: Number,
      customOdds: {
        draw: Number
      }
    }, { strict: false });
    
    const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);
    
    // Testar colecções de ligas (atual e histórica)
    const LaLiga2025 = mongoose.models.LaLiga2025 || mongoose.model('LaLiga2025', GameSchema, 'laliga_2025_26');
    const LaLiga2024 = mongoose.models.LaLiga2024 || mongoose.model('LaLiga2024', GameSchema, 'laliga_2024_25');
    
    // Verificar todas as colecções na base de dados
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 COLECÇÕES DISPONÍVEIS:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Verificar jogos na colecção 'games' (vazia)
    const totalJogos = await Game.countDocuments();
    console.log(`\n📊 Total de jogos na colecção 'games': ${totalJogos}`);
    
    // Verificar La Liga especificamente
    const totalLaLiga2025 = await LaLiga2025.countDocuments();
    const totalLaLiga2024 = await LaLiga2024.countDocuments();
    console.log(`📊 Total equipas em La Liga 2025-26: ${totalLaLiga2025}`);
    console.log(`📊 Total equipas em La Liga 2024-25: ${totalLaLiga2024}`);
    
    // Ver estrutura das equipas (tentar época histórica primeiro)
    let exemploEquipas = await LaLiga2024.find({}).limit(2);
    let epoca = '2024-25';
    
    if (exemploEquipas.length === 0) {
      exemploEquipas = await LaLiga2025.find({}).limit(2);
      epoca = '2025-26';
    }
    console.log(`\n🔍 ESTRUTURA REAL DAS EQUIPAS (Época ${epoca}):`);
    exemploEquipas.forEach((equipa, i) => {
      console.log(`${i+1}. EQUIPA: ${equipa.teamName}`);
      console.log(`   Liga: ${equipa.league}`);
      console.log(`   Jogos no array: ${equipa.games?.length || 0}`);
      
      if (equipa.games && equipa.games.length > 0) {
        console.log('   EXEMPLO DE JOGO:');
        const jogo = equipa.games[0];
        console.log(`   - ${jogo.homeTeam} vs ${jogo.awayTeam}`);
        console.log(`   - Data: ${jogo.date}`);
        console.log(`   - HomeScore: ${jogo.homeScore} | AwayScore: ${jogo.awayScore}`);
        console.log(`   - Keys do jogo: ${Object.keys(jogo).join(', ')}`);
      }
      console.log('─'.repeat(40));
    });
    
    // Buscar equipas que tenham jogos com resultado (tentar época histórica primeiro)
    let equipasComJogosFinalizados = await LaLiga2024.find({
      'games.teamScore': { $exists: true, $ne: null }
    }).limit(3);
    
    if (equipasComJogosFinalizados.length === 0) {
      console.log('⚠️  Sem resultados na época 2024-25, tentando 2025-26...');
      equipasComJogosFinalizados = await LaLiga2025.find({
        'games.teamScore': { $exists: true, $ne: null }
      }).limit(3);
    }
    
    // Extrair jogos individuais com resultado
    let jogosComResultado = [];
    equipasComJogosFinalizados.forEach(equipa => {
      if (equipa.games) {
        equipa.games.forEach(jogo => {
          if (jogo.teamScore !== undefined && jogo.teamScore !== null && 
              jogo.opponentScore !== undefined && jogo.opponentScore !== null) {
            
            // Construir homeTeam/awayTeam baseado em isHome
            const homeTeam = jogo.isHome ? equipa.teamName : jogo.opponent;
            const awayTeam = jogo.isHome ? jogo.opponent : equipa.teamName;
            const homeScore = jogo.isHome ? jogo.teamScore : jogo.opponentScore;
            const awayScore = jogo.isHome ? jogo.opponentScore : jogo.teamScore;
            
            jogosComResultado.push({
              homeTeam,
              awayTeam, 
              homeScore,
              awayScore,
              date: jogo.date,
              status: jogo.status,
              sportRadarId: jogo.sportRadarId,
              league: equipa.league,
              _equipaDoc: equipa._id,
              _jogoId: jogo._id
            });
          }
        });
      }
    });
    
    // Ordenar por data mais recente e remover duplicados
    const jogosUnicos = new Map();
    jogosComResultado.forEach(jogo => {
      const key = `${jogo.homeTeam}-${jogo.awayTeam}-${jogo.date}`;
      if (!jogosUnicos.has(key)) {
        jogosUnicos.set(key, jogo);
      }
    });
    
    jogosComResultado = Array.from(jogosUnicos.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5); // Top 5 mais recentes
    
    console.log(`\n📊 ENCONTRADOS ${jogosComResultado.length} JOGOS:`);
    
    jogosComResultado.forEach((jogo, i) => {
      const data = new Date(jogo.date).toLocaleDateString('pt-PT');
      console.log(`${i+1}. ${jogo.homeTeam} vs ${jogo.awayTeam}`);
      console.log(`   📅 ${data}`);
      console.log(`   ⚽ ${jogo.homeScore}-${jogo.awayScore}`);
      console.log(`   🏆 ${jogo.league}`);
      console.log(`   🎯 CustomOdds: ${jogo.customOdds?.draw || 'Nenhuma'}`);
      console.log(`   🆔 ${jogo._id}`);
      console.log('─'.repeat(25));
    });
    
    if (jogosComResultado.length > 0) {
      const primeiroJogo = jogosComResultado[0];
      
      // Simular estrutura HistoricalGame
      console.log('\n🏗️  ESTRUTURA HISTÓRICA SERIA:');
      
      const season = calculateSeason(primeiroJogo.date);
      const teamOdds = {
        [primeiroJogo.homeTeam]: { draw: primeiroJogo.customOdds?.draw || 3.0 },
        [primeiroJogo.awayTeam]: { draw: primeiroJogo.customOdds?.draw || 3.0 }
      };
      
      console.log(`Season: ${season}`);
      console.log(`TeamOdds: ${JSON.stringify(teamOdds, null, 2)}`);
      
      console.log('\n🎯 ESTRUTURA VALIDADA!');
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  }
}

function calculateSeason(gameDate) {
  const date = new Date(gameDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (month < 7) {
    return `${year - 1}-${String(year).slice(-2)}`;
  } else {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
}

testMongoDB();