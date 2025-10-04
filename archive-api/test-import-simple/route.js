import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

// Schema simples para teste
const TestHistoricalSchema = new mongoose.Schema({
  teamName: String,
  league: String,
  season: String,
  gamesCount: Number,
  sampleGame: Object,
  lastUpdated: { type: Date, default: Date.now }
});

export async function GET() {
  try {
    console.log('🚀 Iniciando teste de importação histórica simplificado...');
    
    await connectToDatabase();
    
    // Criar modelo de teste
    const TestModel = mongoose.models.test_historical_2024_25 || 
      mongoose.model('test_historical_2024_25', TestHistoricalSchema, 'test_historical_2024_25');
    
    // Buscar dados da API
    const url = 'https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/stats_season_fixtures2/118691';
    
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://www.betano.pt/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Dados da API obtidos');
    
    // Processar dados básicos
    if (data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches) {
      const matches = data.doc[0].data.matches;
      console.log(`📊 Encontrados ${matches.length} jogos`);
      
      // Extrair equipas únicas
      const teams = new Set();
      matches.forEach(match => {
        if (match.teams?.home?.name) teams.add(match.teams.home.name);
        if (match.teams?.away?.name) teams.add(match.teams.away.name);
      });
      
      console.log(`⚽ Encontradas ${teams.size} equipas`);
      
      // Salvar algumas equipas de teste
      let savedCount = 0;
      for (const teamName of Array.from(teams).slice(0, 3)) { // Apenas 3 equipas para teste
        const teamGames = matches.filter(match => 
          match.teams?.home?.name === teamName || match.teams?.away?.name === teamName
        );
        
        const testDoc = {
          teamName: teamName,
          league: 'laliga',
          season: '2024-25',
          gamesCount: teamGames.length,
          sampleGame: teamGames[0] ? {
            opponent: teamGames[0].teams?.home?.name === teamName ? 
              teamGames[0].teams?.away?.name : teamGames[0].teams?.home?.name,
            date: teamGames[0].time?.date,
            isHome: teamGames[0].teams?.home?.name === teamName
          } : null
        };
        
        await TestModel.findOneAndUpdate(
          { teamName: teamName, season: '2024-25' },
          testDoc,
          { upsert: true, new: true }
        );
        
        savedCount++;
        console.log(`✅ Salvou dados de teste para: ${teamName}`);
      }
      
      return Response.json({
        success: true,
        message: 'Teste de importação concluído',
        apiStatus: response.status,
        matchesFound: matches.length,
        teamsFound: teams.size,
        testTeamsSaved: savedCount,
        sampleTeams: Array.from(teams).slice(0, 5),
        collectionName: 'test_historical_2024_25',
        timestamp: new Date().toISOString()
      });
      
    } else {
      throw new Error('Estrutura de dados da API inesperada');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return Response.json({
      success: false,
      message: 'Erro no teste de importação',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}