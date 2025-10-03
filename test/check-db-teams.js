const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkDatabaseTeams() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Verificar La Liga
    const laligaDB = mongoose.connection.useDb('Empates');
    const LaLigaModel = laligaDB.model('LaLiga', new mongoose.Schema({
      teamName: String,
      games: Array
    }, { strict: false }), 'laliga');
    
    const teams = await LaLigaModel.find({}, { teamName: 1, _id: 0 }).lean();
    
    console.log('\n📋 Equipas encontradas na base de dados La Liga:');
    teams.forEach(team => {
      console.log(`   - "${team.teamName}"`);
    });
    
    // Procurar por Betis especificamente
    console.log('\n🔍 Procurando por "Betis":');
    const betisTeams = teams.filter(team => 
      team.teamName.toLowerCase().includes('betis')
    );
    
    if (betisTeams.length > 0) {
      console.log('✅ Encontrado na base de dados:');
      betisTeams.forEach(team => {
        console.log(`   - "${team.teamName}"`);
      });
    } else {
      console.log('❌ Nenhuma equipa com "Betis" encontrada na base de dados');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkDatabaseTeams();