import { ensureDataExists } from '../../../lib/dataLoader.js';

export async function GET() {
  try {
    console.log('🔍 Testando ensureDataExists com DEBUG ativado...');
    
    // Ativar modo DEBUG
    process.env.DEBUG = 'true';
    
    // Executar ensureDataExists
    const result = await ensureDataExists();
    
    console.log(`✅ ensureDataExists resultado: ${result}`);
    
    // Desativar DEBUG após o teste
    delete process.env.DEBUG;
    
    return Response.json({
      success: true,
      ensureDataExistsResult: result,
      message: 'Teste de ensureDataExists concluído com DEBUG',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no teste de ensureDataExists:', error);
    
    // Garantir que DEBUG é desativado mesmo em caso de erro
    delete process.env.DEBUG;
    
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}