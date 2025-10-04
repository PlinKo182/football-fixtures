import { getTeamHistoricalGames } from '../../../lib/historicalDataLoader.js';

export async function GET() {
  try {
    const games = await getTeamHistoricalGames('Bétis');
    return Response.json({ success: true, total: games.length, sample: games.slice(0,5) });
  } catch (err) { return Response.json({ success: false, error: err.message }, { status: 500 }); }
}
