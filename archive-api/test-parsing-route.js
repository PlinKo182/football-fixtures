// archived placeholder for /api/test-parsing
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/test-parsing' }), { status: 200 });
}
