// archived placeholder for /api/add-test-results
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/add-test-results' }), { status: 200 });
}
// Archived copy of app/api/add-test-results/route.js

import connectToDatabase from '../../../lib/mongodb.js';
import { getHistoricalModel } from '../../../lib/historicalDataLoader.js';

export async function GET() {
  try {
    console.log('🔧 Adicionando dados de teste com resultados...');
    
    await connectToDatabase();
    
    const HistoricalModel = getHistoricalModel('laliga', '2024-25');
    
    // Criar alguns jogos de teste do Bétis com resultados reais da época 24/25
    const testGames = [ /* ... */ ];

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

    return Response.json({ success: true, message: 'Dados de teste adicionados com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao adicionar dados de teste:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
