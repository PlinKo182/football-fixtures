// archived placeholder for /api/test-ensure-data
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/test-ensure-data' }), { status: 200 });
}
