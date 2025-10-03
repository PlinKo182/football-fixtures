require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkAllCollections() {
  let client;
  try {
    console.log('🔍 Verificando todas as coleções no MongoDB...\n');
    
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('Empates');
    
    // Listar todas as coleções
    const collections = await db.listCollections().toArray();
    console.log('📋 Coleções disponíveis:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');
    
    // Verificar cada liga
    const leagues = ['La Liga', 'Ligue 1', 'Premier League'];
    
    for (const league of leagues) {
      console.log(`🏆 ${league}:`);
      const collection = db.collection(league);
      const teams = await collection.find({}, { teamName: 1 }).toArray();
      
      if (teams.length === 0) {
        console.log(`   ❌ Coleção VAZIA!`);
      } else {
        console.log(`   ✅ ${teams.length} equipas:`);
        teams.forEach(team => {
          console.log(`      - "${team.teamName}"`);
        });
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

checkAllCollections();