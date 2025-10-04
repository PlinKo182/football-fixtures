// archived placeholder for /api/test-teamloader
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/test-teamloader' }), { status: 200 });
}
