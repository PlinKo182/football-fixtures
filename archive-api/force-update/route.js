import { ensureDataExists } from '@/lib/dataLoader';

export async function POST() {
  try {
    console.log('🔄 API: Forçando atualização de dados...');
    
    const result = await ensureDataExists();
    
    return Response.json({
      success: true,
      message: result ? 'Dados atualizados com sucesso!' : 'Dados já estavam atualizados',
      updated: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na API de atualização:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}