require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function inspectSportsRadarData() {
  try {
    console.log('🔍 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.useDb('Empates');
    
    console.log('✅ Conectado! Verificando dados da La Liga...\n');
    
    // Verificar La Liga
    const LaLigaModel = db.model('LaLiga', new mongoose.Schema({}, { strict: false }), 'laliga');
    const teams = await LaLigaModel.find({}).lean();
    
    console.log('📊 DADOS ATUAIS NA BASE DE DADOS:');
    console.log('=' .repeat(50));
    
    teams.forEach((team, index) => {
      console.log(`\n${index + 1}. EQUIPA: "${team.teamName}"`);
      console.log(`   - Liga: ${team.league || 'N/A'}`);
      console.log(`   - Total de jogos: ${team.games ? team.games.length : 0}`);
      
      if (team.games && team.games.length > 0) {
        console.log(`   - Primeiro jogo:`);
        const firstGame = team.games[0];
        console.log(`     * vs ${firstGame.opponent}`);
        console.log(`     * Data: ${firstGame.date}`);
        console.log(`     * Local: ${firstGame.location}`);
      }
      
      // Se contém "betis" ou similar
      if (team.teamName.toLowerCase().includes('betis')) {
        console.log(`   🎯 ESTA É A EQUIPA BETIS!`);
      }
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log('🔍 PROCURANDO POR QUALQUER VARIAÇÃO DE BETIS:');
    
    const betisVariations = teams.filter(team => 
      team.teamName.toLowerCase().includes('betis') ||
      team.teamName.toLowerCase().includes('bétis')
    );
    
    if (betisVariations.length > 0) {
      console.log('✅ ENCONTRADO:');
      betisVariations.forEach(team => {
        console.log(`   - "${team.teamName}" (${team.games?.length || 0} jogos)`);
      });
    } else {
      console.log('❌ NENHUMA EQUIPA COM "BETIS" ENCONTRADA');
      console.log('\n📋 Equipas disponíveis:');
      teams.forEach(team => {
        console.log(`   - "${team.teamName}"`);
      });
    }
    
    // Verificar se há dados brutos/raw na base
    console.log('\n🔍 Verificando outras coleções...');
    const collections = await db.db.listCollections().toArray();
    console.log('📂 Coleções encontradas:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

inspectSportsRadarData();