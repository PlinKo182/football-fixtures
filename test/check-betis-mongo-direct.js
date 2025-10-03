require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkBetisInMongo() {
  let client;
  try {
    console.log('🔍 Verificando como o Bétis está armazenado no MongoDB...\n');
    
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('Empates');
    const laLigaCollection = db.collection('La Liga');
    
    // Buscar documentos que contenham "bétis" ou "betis" (case insensitive)
    const betisVariants = await laLigaCollection.find({
      teamName: { $regex: /betis/i }
    }).toArray();
    
    console.log('📋 Variantes de "Bétis" encontradas:');
    betisVariants.forEach(team => {
      console.log(`   - "${team.teamName}" (${team.games.length} jogos)`);
      
      // Mostrar próximos jogos
      const now = new Date();
      const upcomingGames = team.games.filter(game => new Date(game.date) > now).slice(0, 3);
      
      console.log('   Próximos jogos:');
      upcomingGames.forEach(game => {
        console.log(`     ${game.date} - ${game.location === 'home' ? 'vs' : '@'} ${game.opponent}`);
      });
      console.log('');
    });
    
    // Buscar também todos os nomes de equipa na La Liga
    console.log('🏆 Todas as equipas na coleção La Liga:');
    const allTeams = await laLigaCollection.find({}, { teamName: 1 }).toArray();
    allTeams.forEach(team => {
      console.log(`   - "${team.teamName}"`);
    });
    
    // Comparar com o que esperamos
    console.log('\n🎯 Nome esperado: "Bétis"');
    const exactMatch = await laLigaCollection.findOne({ teamName: 'Bétis' });
    if (exactMatch) {
      console.log('✅ Encontrado match exato para "Bétis"');
      console.log(`   Jogos: ${exactMatch.games.length}`);
    } else {
      console.log('❌ NÃO encontrado match exato para "Bétis"');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

checkBetisInMongo();