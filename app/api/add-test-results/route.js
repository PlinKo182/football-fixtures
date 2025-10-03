import connectToDatabase from '../../../lib/mongodb.js';
import { getHistoricalModel } from '../../../lib/historicalDataLoader.js';

export async function GET() {
  try {
    console.log('🔧 Adicionando dados de teste com resultados...');
    
    await connectToDatabase();
    
    const HistoricalModel = getHistoricalModel('laliga', '2024-25');
    
    // Criar alguns jogos de teste do Bétis com resultados reais da época 24/25
    const testGames = [
      {
        opponent: 'Girona',
        isHome: true,
        date: new Date('2024-08-15'),
        time: '20:00',
        status: 'finished',
        teamScore: 1,
        opponentScore: 1
      },
      {
        opponent: 'Alavés',
        isHome: false,
        date: new Date('2024-08-25'),
        time: '18:30',
        status: 'finished',
        teamScore: 1,
        opponentScore: 0
      },
      {
        opponent: 'Getafe',
        isHome: true,
        date: new Date('2024-09-01'),
        time: '16:15',
        status: 'finished',
        teamScore: 2,
        opponentScore: 1
      },
      {
        opponent: 'Leganés',
        isHome: true,
        date: new Date('2024-09-15'),
        time: '19:00',
        status: 'finished',
        teamScore: 1,
        opponentScore: 0
      },
      {
        opponent: 'Maiorca',
        isHome: false,
        date: new Date('2024-09-23'),
        time: '21:00',
        status: 'finished',
        teamScore: 0,
        opponentScore: 1
      }
    ];

    // Atualizar os dados do Bétis com jogos de teste
    const result = await HistoricalModel.findOneAndUpdate(
      { teamName: 'Bétis', season: '2024-25', league: 'laliga' },
      {
        $set: {
          games: testGames,
          lastUpdated: new Date()
        }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Dados de teste adicionados: ${testGames.length} jogos`);
    
    testGames.forEach((game, index) => {
      console.log(`🎮 Jogo teste ${index + 1}: Bétis ${game.teamScore}-${game.opponentScore} ${game.opponent} (${game.isHome ? 'Casa' : 'Fora'})`);
    });

    return Response.json({
      success: true,
      message: 'Dados de teste adicionados com sucesso',
      testGames: testGames,
      totalGames: testGames.length
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar dados de teste:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}