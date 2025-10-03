require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkCorrectCollections() {
  let client;
  try {
    console.log('🔍 Verificando coleções com nomes corretos...\n');
    
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('Empates');
    
    // Verificar coleções com nomes minúsculos
    const collections = ['laliga', 'ligue1', 'premierleague'];
    
    for (const collectionName of collections) {
      console.log(`🏆 ${collectionName}:`);
      const collection = db.collection(collectionName);
      const teams = await collection.find({}, { teamName: 1 }).toArray();
      
      if (teams.length === 0) {
        console.log(`   ❌ Coleção VAZIA!`);
      } else {
        console.log(`   ✅ ${teams.length} equipas:`);
        teams.forEach(team => {
          console.log(`      - "${team.teamName}"`);
        });
        
        // Verificar especificamente o Bétis na laliga
        if (collectionName === 'laliga') {
          const betis = await collection.findOne({ teamName: { $regex: /betis/i } });
          if (betis) {
            console.log(`      🎯 Bétis encontrado: "${betis.teamName}" (${betis.games.length} jogos)`);
          }
        }
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

checkCorrectCollections();