// archived placeholder for /api/test-historical-structure
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/test-historical-structure' }), { status: 200 });
}
