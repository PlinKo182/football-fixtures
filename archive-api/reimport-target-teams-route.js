// archived placeholder for /api/reimport-target-teams
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/reimport-target-teams' }), { status: 200 });
}
