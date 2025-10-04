import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Verificando dados brutos históricos...');
    const data = await getTeamGamesWithHistory('Bétis');
    return Response.json({ success: true, totalGames: data?.games?.length, sample: data?.games?.slice(0,5) });
  } catch (error) {
    console.error('❌ erro', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
