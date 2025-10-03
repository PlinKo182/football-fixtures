import { ensureDataExists } from '../../../lib/dataLoader.js';

export async function GET() {
  try {
    console.log('🔄 Forçando atualização completa dos dados atuais...');
    
    // Forçar atualização dos dados atuais da SportsRadar
    await ensureDataExists();
    
    console.log('✅ Atualização forçada concluída');
    
    return Response.json({
      success: true,
      message: 'Dados atuais atualizados da SportsRadar',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na atualização forçada:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}