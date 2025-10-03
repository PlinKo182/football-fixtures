import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log('🔄 Iniciando migração para estrutura com épocas...');
    
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    // Obter todas as coleções
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    console.log('📊 Coleções encontradas:', collectionNames);
    
    const results = {
      migratedCollections: [],
      errors: [],
      summary: {}
    };
    
    // Migrar coleções da época atual (sem sufixo) para formato com época
    const currentSeasonCollections = ['laliga', 'premierleague', 'ligue1'];
    
    for (const collectionName of currentSeasonCollections) {
      if (collectionNames.includes(collectionName)) {
        try {
          console.log(`📋 Migrando ${collectionName} para ${collectionName}_2025_26...`);
          
          const sourceCollection = db.collection(collectionName);
          const targetCollectionName = `${collectionName}_2025_26`;
          
          // Verificar se a coleção de destino já existe
          if (collectionNames.includes(targetCollectionName)) {
            console.log(`⚠️  ${targetCollectionName} já existe, pulando...`);
            results.errors.push(`${targetCollectionName} já existe`);
            continue;
          }
          
          // Copiar todos os documentos
          const documents = await sourceCollection.find({}).toArray();
          
          if (documents.length > 0) {
            const targetCollection = db.collection(targetCollectionName);
            await targetCollection.insertMany(documents);
            
            console.log(`✅ ${documents.length} documentos copiados para ${targetCollectionName}`);
            
            // Opcionalmente, remover a coleção original (comentado por segurança)
            // await sourceCollection.drop();
            // console.log(`🗑️  Coleção original ${collectionName} removida`);
            
            results.migratedCollections.push({
              from: collectionName,
              to: targetCollectionName,
              documentsCount: documents.length
            });
          } else {
            console.log(`📭 ${collectionName} está vazia, pulando...`);
          }
          
        } catch (error) {
          console.error(`❌ Erro ao migrar ${collectionName}:`, error);
          results.errors.push(`${collectionName}: ${error.message}`);
        }
      } else {
        console.log(`ℹ️  ${collectionName} não encontrada`);
      }
    }
    
    // Resumo
    results.summary = {
      totalMigrated: results.migratedCollections.length,
      totalErrors: results.errors.length,
      newStructure: {
        current: results.migratedCollections.map(m => m.to),
        historical: collectionNames.filter(name => name.includes('2024_25'))
      }
    };
    
    console.log('🎉 Migração concluída!');
    console.log('📊 Resumo:', results.summary);
    
    return Response.json({
      success: true,
      message: 'Migração para estrutura com épocas concluída',
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    
    return Response.json({
      success: false,
      message: 'Erro na migração',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}