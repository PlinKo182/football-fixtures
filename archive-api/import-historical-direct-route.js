// archived placeholder for /api/import-historical-direct
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/import-historical-direct' }), { status: 200 });
}
