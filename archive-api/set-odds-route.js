// archived placeholder for /api/set-odds
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/set-odds' }), { status: 200 });
}
