import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Verificando dados brutos históricos...');
    return new Response(JSON.stringify({ success: false, error: 'archived' }), { status: 410, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('❌ erro', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
