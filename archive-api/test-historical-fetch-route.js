// archived placeholder for /api/test-historical-fetch
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/test-historical-fetch' }), { status: 200 });
}
