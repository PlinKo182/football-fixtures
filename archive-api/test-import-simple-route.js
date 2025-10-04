// archived placeholder for /api/test-import-simple
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/test-import-simple' }), { status: 200 });
}
