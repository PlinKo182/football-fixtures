// Archived copy of app/api/basic-test/route.js

import { getTeamGamesOptimized } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Teste básico - Buscando dados do Bétis...');
    const betisData = await getTeamGamesOptimized('Bétis');
    return Response.json({ success: true, teamName: betisData.teamName });
  } catch (error) {
    console.error('❌ Erro no teste básico:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
