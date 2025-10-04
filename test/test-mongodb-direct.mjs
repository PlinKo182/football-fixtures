// Definir variável ANTES dos imports
process.env.MONGODB_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Empates?retryWrites=true&w=majority&appName=Cluster0';

// Teste directo da migração via MongoDB (sem HTTP)
import connectToDatabase from '../lib/mongodb.js';
import Game from '../models/Game.js';
import HistoricalGame from '../models/HistoricalGame.js';

async function testMigrationDirect() {
  console.log('🧪 TESTE DIRECTO DA MIGRAÇÃO - MONGODB');
  console.log('═'.repeat(50));
  
  try {
    // Conectar à base de dados
    console.log('🔌 Conectando à MongoDB...');
    await connectToDatabase();
    console.log('✅ Conectado com sucesso');
    
    // 1. Buscar jogos candidatos (com resultado)
    console.log('\n1️⃣ BUSCANDO CANDIDATOS...');
    const candidatos = await Game.find({
      $and: [
        { homeScore: { $exists: true, $ne: null } },
        { awayScore: { $exists: true, $ne: null } }
      ]
    }).limit(5).sort({ date: -1 });
    
    console.log(`✅ Encontrados ${candidatos.length} jogos com resultado:`);
    
    candidatos.forEach((game, index) => {
      const date = new Date(game.date).toLocaleDateString('pt-PT');
      console.log(`${index + 1}. ${game.homeTeam} vs ${game.awayTeam}`);
      console.log(`   📅 ${date}`);
      console.log(`   ⚽ ${game.homeScore}-${game.awayScore}`);
      console.log(`   🏆 ${game.league}`);
      console.log(`   🎯 CustomOdds: ${game.customOdds?.draw || 'Nenhuma'}`);
      console.log(`   🆔 ${game._id}`);
      console.log('─'.repeat(30));
    });
    
    if (candidatos.length === 0) {
      console.log('⚠️  Nenhum jogo com resultado encontrado');
      return;
    }
    
    // 2. Testar migração do primeiro jogo
    const firstGame = candidatos[0];
    console.log(`\n2️⃣ TESTANDO MIGRAÇÃO: ${firstGame.homeTeam} vs ${firstGame.awayTeam}`);
    
    // Verificar se já existe na base histórica
    const existingHistorical = await HistoricalGame.findOne({
      homeTeam: firstGame.homeTeam,
      awayTeam: firstGame.awayTeam,
      date: firstGame.date
    });
    
    if (existingHistorical) {
      console.log('⚠️  Jogo já existe na base histórica!');
      console.log(`   🆔 ID histórico: ${existingHistorical._id}`);
      console.log(`   🎯 TeamOdds: ${JSON.stringify(Object.fromEntries(existingHistorical.teamOdds))}`);
      return;
    }
    
    // 3. Simular criação do registo histórico
    console.log('🧪 SIMULANDO CRIAÇÃO...');
    
    const season = HistoricalGame.calculateSeason(firstGame.date);
    console.log(`📅 Season calculada: ${season}`);
    
    // Preparar teamOdds
    const teamOdds = new Map();
    const oddsValue = firstGame.customOdds?.draw || 3.0;
    teamOdds.set(firstGame.homeTeam, { draw: oddsValue });
    teamOdds.set(firstGame.awayTeam, { draw: oddsValue });
    
    const historicalData = {
      league: firstGame.league,
      homeTeam: firstGame.homeTeam,
      awayTeam: firstGame.awayTeam,
      date: firstGame.date,
      time: firstGame.time,
      homeScore: firstGame.homeScore,
      awayScore: firstGame.awayScore,
      status: 'finished',
      season: season,
      originalGameId: firstGame._id.toString(),
      sportRadarId: firstGame.sportRadarId,
      teamOdds: teamOdds
    };
    
    console.log('\n📊 DADOS QUE SERIAM CRIADOS:');
    console.log(`   Teams: ${historicalData.homeTeam} vs ${historicalData.awayTeam}`);
    console.log(`   Score: ${historicalData.homeScore}-${historicalData.awayScore}`);
    console.log(`   League: ${historicalData.league}`);
    console.log(`   Season: ${historicalData.season}`);
    console.log(`   TeamOdds: ${JSON.stringify(Object.fromEntries(teamOdds))}`);
    
    // 4. CRIAR REALMENTE (descomenta se quiseres testar a criação real)
    console.log('\n🤔 Criar registo histórico real? (descomentado se necessário)');
    /*
    const historicalGame = await HistoricalGame.create(historicalData);
    console.log('✅ CRIADO COM SUCESSO!');
    console.log(`   🆔 ID histórico: ${historicalGame._id}`);
    */
    
    console.log('\n🎯 TESTE CONCLUÍDO - ESTRUTURA VALIDADA!');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Executar teste
testMigrationDirect();