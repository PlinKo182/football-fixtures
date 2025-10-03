import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';

export async function GET(request) {
  const url = new URL(request.url);
  const team = url.searchParams.get('team') || 'Bétis';
  const data = await getTeamGamesWithHistory(team, true);
  return Response.json(data);
}
