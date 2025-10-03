import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';
import { saveHistoricalData } from '@/lib/historicalDataLoader';

export async function GET() {
  try {
    console.log('🧹 Limpando dados históricos anteriores...');
    
    await connectToDatabase();
    
    // Apagar coleção anterior com todas as equipas
    const db = mongoose.connection.db;
    
    try {
      await db.collection('laliga_2024_25').drop();
      console.log('🗑️  Coleção laliga_2024_25 removida');
    } catch (error) {
      console.log('ℹ️  Coleção laliga_2024_25 não existia');
    }
    
    console.log('🚀 Reimportando apenas equipas alvo...');
    
    const result = await saveHistoricalData('laliga', '2024-25');
    
    return Response.json({
      success: true,
      message: 'Dados históricos reimportados apenas para equipas alvo',
      result: result,
      targetTeams: ['Osasuna', 'Bétis', 'Atl. Bilbao'],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na reimportação:', error);
    
    return Response.json({
      success: false,
      message: 'Erro na reimportação',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}