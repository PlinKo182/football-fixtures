// archived placeholder for /api/migrate-to-seasons
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/migrate-to-seasons' }), { status: 200 });
}
