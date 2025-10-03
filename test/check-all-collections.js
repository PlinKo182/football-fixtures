require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function checkAllCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.useDb('Empates');
    
    console.log('🔍 Verificando todas as coleções...\n');
    
    // La Liga
    const LaLiga = db.model('LaLiga', new mongoose.Schema({}, { strict: false }), 'laliga');
    const laLigaTeams = await LaLiga.find({}).lean();
    console.log('📋 LA LIGA:');
    laLigaTeams.forEach(team => {
      console.log(`   - "${team.teamName}" (${team.games?.length || 0} jogos)`);
    });
    
    // Ligue 1
    const Ligue1 = db.model('Ligue1', new mongoose.Schema({}, { strict: false }), 'ligue1');
    const ligue1Teams = await Ligue1.find({}).lean();
    console.log('\n📋 LIGUE 1:');
    ligue1Teams.forEach(team => {
      console.log(`   - "${team.teamName}" (${team.games?.length || 0} jogos)`);
    });
    
    // Premier League
    const PremierLeague = db.model('PremierLeague', new mongoose.Schema({}, { strict: false }), 'premierleague');
    const plTeams = await PremierLeague.find({}).lean();
    console.log('\n📋 PREMIER LEAGUE:');
    plTeams.forEach(team => {
      console.log(`   - "${team.teamName}" (${team.games?.length || 0} jogos)`);
    });
    
    console.log('\n📊 RESUMO:');
    console.log(`   La Liga: ${laLigaTeams.length} equipas`);
    console.log(`   Ligue 1: ${ligue1Teams.length} equipas`);
    console.log(`   Premier League: ${plTeams.length} equipas`);
    console.log(`   Total: ${laLigaTeams.length + ligue1Teams.length + plTeams.length} equipas`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkAllCollections();