// Simular exatamente o que a aplicação faz
import mongoose from 'mongoose';

// Conectar diretamente sem usar o arquivo .env
const MONGODB_URI = 'mongodb+srv://franciscoamaralsilva:7nH6ZlXfOwfA9mOO@empates.k5vwf.mongodb.net/Empates?retryWrites=true&w=majority&appName=Empates';

// Definir o schema exatamente como no Team.js  
const GameSchema = new mongoose.Schema({
  opponent: String,
  isHome: Boolean,
  date: Date,
  time: String,
  status: String,
  teamScore: Number,
  opponentScore: Number,
  sportRadarId: String
});

const TeamSchema = new mongoose.Schema({
  teamName: String,
  league: String,
  games: [GameSchema],
  lastUpdated: { type: Date, default: Date.now }
});

function getLeagueModel(leagueName) {
  const collectionName = leagueName.replace(/\s+/g, '').toLowerCase();
  
  if (mongoose.models[collectionName]) {
    delete mongoose.models[collectionName];
  }
  
  return mongoose.model(collectionName, TeamSchema, collectionName);
}

async function simulateApplicationBehavior() {
  console.log('🎯 SIMULANDO COMPORTAMENTO EXATO DA APLICAÇÃO...\n');
  
  try {
    console.log('🔗 Conectando diretamente...');
    await mongoose.connect(MONGODB_URI);
    
    console.log(`   ✅ Conectado à: ${mongoose.connection.db.databaseName}`);
    console.log('');
    
    console.log('📊 CRIANDO MODELO PARA LA LIGA...');
    const LaLigaModel = getLeagueModel('La Liga');
    
    console.log(`   Modelo: ${LaLigaModel.modelName}`);
    console.log(`   Coleção: ${LaLigaModel.collection.name}`);
    console.log(`   Database: ${LaLigaModel.db.databaseName}`);
    console.log('');
    
    console.log('💾 SALVANDO DADOS DE TESTE...');
    const testTeam = {
      teamName: 'Barcelona',
      league: 'La Liga',
      games: [{
        opponent: 'Real Madrid',
        isHome: true,
        date: new Date('2025-10-26'),
        time: '20:00',
        status: 'scheduled',
        teamScore: null,
        opponentScore: null,
        sportRadarId: 'test123'
      }],
      lastUpdated: new Date()
    };
    
    const savedTeam = await LaLigaModel.findOneAndUpdate(
      { teamName: 'Barcelona' },
      testTeam,
      { upsert: true, new: true }
    );
    
    console.log(`   ✅ Equipa salva: ${savedTeam._id}`);
    console.log(`   📊 Na database: ${mongoose.connection.db.databaseName}`);
    console.log(`   📊 Na coleção: ${LaLigaModel.collection.name}`);
    console.log('');
    
    // Verificar onde foi realmente salvo
    console.log('🔍 VERIFICAÇÃO FINAL...');
    
    // Verificar Empates
    console.log('   📁 Base Empates:');
    const empatesCollections = await mongoose.connection.db.listCollections().toArray();
    for (const col of empatesCollections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`      - ${col.name}: ${count} docs`);
    }
    
    // Verificar test
    console.log('   📁 Base test:');
    const testDb = mongoose.connection.client.db('test');
    const testCollections = await testDb.listCollections().toArray();
    
    if (testCollections.length === 0) {
      console.log('      (vazia)');
    } else {
      for (const col of testCollections) {
        const count = await testDb.collection(col.name).countDocuments();
        console.log(`      - ${col.name}: ${count} docs`);
      }
    }
    
    // Limpar teste
    await LaLigaModel.findByIdAndDelete(savedTeam._id);
    console.log('\n🧹 Dados de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

simulateApplicationBehavior();