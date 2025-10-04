import { getTeamHistoricalGames } from '../../../lib/historicalDataLoader.js';

export async function GET() {
  const games = await getTeamHistoricalGames('Bétis');
  const withScores = games.filter(g => g.teamScore != null || g.opponentScore != null);
  return Response.json({ success: true, total: games.length, withScores: withScores.length });
}
