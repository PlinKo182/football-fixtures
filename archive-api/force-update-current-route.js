// archived placeholder for /api/force-update-current
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/force-update-current' }), { status: 200 });
}
