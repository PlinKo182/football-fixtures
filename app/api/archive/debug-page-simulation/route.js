import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';

export async function GET() {
  try {
    console.log('🔍 Simulando carregamento da página da equipa - Bétis...');
    const teamData = await getTeamGamesWithHistory('Bétis');
    if (!teamData) return Response.json({ success: false, message: 'getTeamGamesWithHistory retornou null' });
    return Response.json({ success: true, teamData });
  } catch (error) {
    console.error('❌ erro', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
