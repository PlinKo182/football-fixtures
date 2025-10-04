// archived placeholder for /api/test-data
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/test-data' }), { status: 200 });
}
