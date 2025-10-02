import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';

async function deepDebugConnection() {
  console.log('🕵️ INVESTIGAÇÃO PROFUNDA DA CONEXÃO...\n');
  
  try {
    const uri = process.env.MONGODB_URI;
    console.log('🔍 ANÁLISE DA URI:');
    console.log(`   URI completa: ${uri}`);
    console.log(`   Database extraída: ${uri.split('/')[3]?.split('?')[0]}`);
    console.log('');
    
    console.log('🔗 CONECTANDO E DEBUGANDO...');
    await mongoose.connect(uri, {
      bufferCommands: false,
    });
    
    console.log('   ✅ Conexão estabelecida');
    console.log(`   📊 Database Name: ${mongoose.connection.db.databaseName}`);
    console.log(`   📊 Connection State: ${mongoose.connection.readyState}`);
    console.log(`   📊 Host: ${mongoose.connection.host}`);
    console.log(`   📊 Port: ${mongoose.connection.port}`);
    console.log('');
    
    // Testar criação de modelo direto
    console.log('🧪 TESTANDO CRIAÇÃO DIRETA DE MODELO...');
    
    const TestSchema = new mongoose.Schema({
      testName: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    // Força especificar a coleção explicitamente
    const TestModel = mongoose.model('debugtest', TestSchema, 'debugtest');
    
    const testDoc = await TestModel.create({
      testName: 'Debug Test ' + Date.now()
    });
    
    console.log(`   ✅ Documento criado: ${testDoc._id}`);
    
    // Verificar onde foi salvo
    console.log('\n🔍 VERIFICANDO ONDE FOI SALVO...');
    console.log(`   Database atual: ${mongoose.connection.db.databaseName}`);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('   Coleções na base atual:');
    collections.forEach(col => {
      console.log(`      - ${col.name}`);
    });
    
    // Verificar também na base test
    console.log('\n🔍 VERIFICANDO SE VAZOU PARA A BASE TEST...');
    const testDbConnection = mongoose.connection.client.db('test');
    const testCollections = await testDbConnection.listCollections().toArray();
    
    if (testCollections.length === 0) {
      console.log('   ✅ Base TEST está vazia');
    } else {
      console.log('   ⚠️  Base TEST contém:');
      for (const col of testCollections) {
        const count = await testDbConnection.collection(col.name).countDocuments();
        console.log(`      - ${col.name}: ${count} docs`);
      }
    }
    
    // Limpar teste
    await TestModel.findByIdAndDelete(testDoc._id);
    await mongoose.connection.db.dropCollection('debugtest');
    console.log('\n🧹 Teste limpo');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

deepDebugConnection();