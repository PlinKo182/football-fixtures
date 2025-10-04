// archived placeholder for /api/force-update
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/force-update' }), { status: 200 });
}
