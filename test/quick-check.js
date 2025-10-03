import { config } from 'dotenv';
config({ path: '.env.local' });

import mongoose from 'mongoose';

const quickCheck = async () => {
  console.log('🔍 Verificação rápida da base...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n📊 COLEÇÕES:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   ${col.name}: ${count} documentos`);
      
      if (count > 0) {
        const sample = await db.collection(col.name).findOne({});
        console.log(`      Primeira equipa: ${sample.teamName || 'N/A'}`);
        console.log(`      Jogos: ${sample.games?.length || 0}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

quickCheck();