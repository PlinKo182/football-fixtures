import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';

export async function GET(request) {
  const url = new URL(request.url);
  const team = url.searchParams.get('team') || 'Bétis';
  const data = await getTeamGamesWithHistory(team, true);
  return Response.json({
    team,
    totalGames: data?.games?.length,
    seasons: data?.seasons,
    games: data?.games?.map(g => ({
      date: g.date,
      season: g.season,
      status: g.status,
      homeTeam: g.homeTeam,
      awayTeam: g.awayTeam,
      homeScore: g.homeScore,
      awayScore: g.awayScore
    }))
  });
}
