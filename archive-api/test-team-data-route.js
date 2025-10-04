// archived placeholder for /api/test-team-data
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/test-team-data' }), { status: 200 });
}
