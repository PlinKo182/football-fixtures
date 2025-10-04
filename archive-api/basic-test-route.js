// archived placeholder for /api/basic-test
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/basic-test' }), { status: 200 });
}
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
