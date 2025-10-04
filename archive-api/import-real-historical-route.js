// archived placeholder for /api/import-real-historical
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/import-real-historical' }), { status: 200 });
}
