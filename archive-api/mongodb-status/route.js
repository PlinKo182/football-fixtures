import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const results = {
      database: mongoose.connection.name,
      totalCollections: collections.length,
      collections: [],
      historicalCollections: []
    };
    
    for (const col of collections) {
      const collection = db.collection(col.name);
      const count = await collection.countDocuments();
      
      const colInfo = {
        name: col.name,
        count: count
      };
      
      results.collections.push(colInfo);
      
      // Se for coleção histórica, buscar um documento de exemplo
      if (col.name.includes('2024') || col.name.includes('test_historical')) {
        const sampleDoc = await collection.findOne();
        colInfo.sampleDoc = sampleDoc;
        results.historicalCollections.push(colInfo);
      }
    }
    
    return Response.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}