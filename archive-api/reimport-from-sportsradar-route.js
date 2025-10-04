// archived placeholder for /api/reimport-from-sportsradar
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/reimport-from-sportsradar' }), { status: 200 });
}
