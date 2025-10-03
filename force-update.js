require('dotenv').config({ path: '.env.local' });
const { ensureDataExists } = require('./lib/dataLoader.js');

async function forceUpdate() {
  try {
    console.log('🔄 Forçando atualização dos dados...');
    console.log('📋 Equipas configuradas: Osasuna, Bétis, Atl. Bilbao');
    
    // Ativar logs detalhados
    process.env.DEBUG = 'true';
    
    // Limpar dados existentes primeiro
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.useDb('Empates');
    await db.collection('laliga').deleteMany({});
    console.log('🗑️  Dados da La Liga limpos');
    
    // Forçar atualização
    await ensureDataExists(true); // true para forçar atualização
    
    console.log('✅ Atualização concluída!');
    
    // Verificar resultados
    const { getAllGames } = require('./lib/dataLoader.js');
    const allGames = await getAllGames();
    
    console.log('\n📊 Resultado final:');
    Object.entries(allGames).forEach(([league, teams]) => {
      console.log(`\n${league}:`);
      teams.forEach(team => {
        console.log(`   - ${team.teamName} (${team.games.length} jogos)`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erro durante atualização:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

forceUpdate();