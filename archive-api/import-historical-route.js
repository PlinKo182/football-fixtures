// archived placeholder for /api/import-historical
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/import-historical' }), { status: 200 });
}
