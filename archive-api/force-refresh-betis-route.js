// archived placeholder for /api/force-refresh-betis
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/force-refresh-betis' }), { status: 200 });
}
