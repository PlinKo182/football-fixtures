import { getTeamGamesWithHistory } from '../../../lib/teamLoader.js';

export async function GET() {
  return new Response(JSON.stringify({
    success: false,
    error: 'This debug route has been archived. See app/api/archive/debug-page-simulation/route.js'
  }), { status: 410, headers: { 'Content-Type': 'application/json' } });
}