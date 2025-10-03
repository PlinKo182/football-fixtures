require('dotenv').config({ path: '.env.local' });
const { connectToDatabase } = require('../lib/mongodb.js');

async function checkBetisInMongo() {
  try {
    console.log('🔍 Verificando como o Bétis está armazenado no MongoDB...\n');
    
    const { db } = await connectToDatabase();
    
    // Verificar coleção La Liga
    const laLigaCollection = db.collection('La Liga');
    
    // Buscar documentos que contenham "bétis" ou "betis" (case insensitive)
    const betisVariants = await laLigaCollection.find({
      teamName: { $regex: /betis/i }
    }).toArray();
    
    console.log('📋 Variantes de "Bétis" encontradas:');
    betisVariants.forEach(team => {
      console.log(`   - "${team.teamName}" (${team.games.length} jogos)`);
      
      // Mostrar primeiros 3 jogos para verificar
      console.log('   Primeiros jogos:');
      team.games.slice(0, 3).forEach(game => {
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
    } else {
      console.log('❌ NÃO encontrado match exato para "Bétis"');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkBetisInMongo();