import { NextResponse } from 'next/server';
import { getTeamGamesWithHistory } from '@/lib/teamLoader';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team') || 'Bétis';

    const data = await getTeamGamesWithHistory(team, true);
    if (!data) {
      return NextResponse.json({ error: 'No data found for team', team }, { status: 404 });
    }

    return NextResponse.json({ team: data.teamName, league: data.league, gamesCount: data.games.length, games: data.games.slice(0, 200) });
  } catch (error) {
    console.error('API /debug-betting error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
