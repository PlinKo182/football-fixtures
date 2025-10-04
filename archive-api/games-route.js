// archived placeholder for /api/games
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/games' }), { status: 200 });
}
