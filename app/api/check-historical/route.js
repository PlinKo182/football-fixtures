import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    
    console.log('🔍 Verificando dados históricos no MongoDB...');
    
    // Listar todas as coleções
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    console.log('📊 Coleções encontradas:', collectionNames);
    
    // Verificar coleções históricas específicas
    const historicalCollections = collectionNames.filter(name => 
      name.includes('2024_25') || name.includes('2024-25')
    );
    
    const results = {};
    
    for (const collectionName of historicalCollections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        const sampleDoc = await collection.findOne();
        
        results[collectionName] = {
          count: count,
          sampleTeam: sampleDoc?.teamName || 'N/A',
          sampleGamesCount: sampleDoc?.games?.length || 0
        };
        
        console.log(`✅ ${collectionName}: ${count} documentos`);
      } catch (error) {
        console.error(`❌ Erro ao verificar ${collectionName}:`, error);
        results[collectionName] = { error: error.message };
      }
    }
    
    return Response.json({
      success: true,
      message: 'Verificação de dados históricos concluída',
      allCollections: collectionNames,
      historicalCollections: historicalCollections,
      historicalData: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    
    return Response.json({
      success: false,
      message: 'Erro ao verificar dados históricos',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}