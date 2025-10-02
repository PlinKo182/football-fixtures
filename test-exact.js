// Teste direto simulando exatamente os imports da aplicação
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env.local da mesma forma que Next.js faz
config({ path: path.join(__dirname, '.env.local') });

console.log('🔍 VERIFICANDO VARIÁVEIS DE AMBIENTE...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
console.log('');

import mongoose from 'mongoose';

// Usar exatamente o mesmo código do mongodb.js
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Por favor, defina a variável MONGODB_URI no arquivo .env.local');
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Schema exato do Team.js
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

const testExactBehavior = async () => {
  console.log('🎯 TESTE EXATO DO COMPORTAMENTO...\n');
  
  try {
    console.log('🔗 Conectando...');
    const conn = await connectToDatabase();
    
    console.log(`   ✅ Conectado à database: ${conn.connection.db.databaseName}`);
    console.log(`   🔗 Host: ${conn.connection.host}`);
    console.log(`   📊 Estado: ${conn.connection.readyState}`);
    console.log('');
    
    console.log('📋 CRIANDO MODELO LA LIGA...');
    const LaLigaModel = getLeagueModel('La Liga');
    
    console.log(`   Modelo: ${LaLigaModel.modelName}`);
    console.log(`   Coleção: ${LaLigaModel.collection.name}`);
    console.log(`   Database do modelo: ${LaLigaModel.db.databaseName}`);
    console.log('');
    
    console.log('💾 SALVANDO UM TESTE...');
    const testTeam = {
      teamName: 'Test Team',
      league: 'La Liga', 
      games: [{
        opponent: 'Test Opponent',
        isHome: true,
        date: new Date(),
        time: '20:00',
        status: 'scheduled'
      }]
    };
    
    const saved = await LaLigaModel.create(testTeam);
    console.log(`   ✅ Salvo com ID: ${saved._id}`);
    console.log('');
    
    console.log('🔍 VERIFICANDO TODAS AS DATABASES...');
    
    // Lista todas as databases  
    const admin = conn.connection.db.admin();
    const databases = await admin.listDatabases();
    
    for (const db of databases.databases) {
      console.log(`\n📁 Database: ${db.name} (${db.sizeOnDisk} bytes)`);
      
      const database = conn.connection.client.db(db.name);
      const collections = await database.listCollections().toArray();
      
      if (collections.length === 0) {
        console.log('   (sem coleções)');
      } else {
        for (const col of collections) {
          const count = await database.collection(col.name).countDocuments();
          console.log(`   - ${col.name}: ${count} documentos`);
        }
      }
    }
    
    // Limpar teste
    await LaLigaModel.findByIdAndDelete(saved._id);
    console.log('\n🧹 Teste removido');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

testExactBehavior();