// archived placeholder for /api/test-historical-url
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/test-historical-url' }), { status: 200 });
}
