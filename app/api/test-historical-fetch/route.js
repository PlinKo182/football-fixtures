import connectToDatabase from '@/lib/mongodb';

// Teste simples para buscar dados da época 2024-25
export async function GET() {
  try {
    console.log('🔍 Testando busca de dados históricos...');
    
    // Testar URL da La Liga 2024-25
    const testUrl = 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/118691';
    
    console.log('📡 Fazendo requisição para:', testUrl);
    
    const response = await fetch(testUrl, {
      headers: {
        'Referer': 'https://www.betano.pt/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Dados recebidos, estrutura:', Object.keys(data));
    
    // Verificar estrutura dos dados
    let matchesCount = 0;
    let teamsFound = [];
    
    if (data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches) {
      const matches = data.doc[0].data.matches;
      matchesCount = matches.length;
      
      // Extrair primeiras 5 equipas para teste
      teamsFound = matches.slice(0, 5).map(match => ({
        home: match.teams?.home?.name,
        away: match.teams?.away?.name,
        date: match.time?.date,
        status: match.result ? 'finished' : 'scheduled'
      }));
    }
    
    return Response.json({
      success: true,
      message: 'Teste de busca de dados históricos',
      url: testUrl,
      responseStatus: response.status,
      dataStructure: Object.keys(data),
      matchesFound: matchesCount,
      sampleTeams: teamsFound,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return Response.json({
      success: false,
      message: 'Erro no teste de dados históricos',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}