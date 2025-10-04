// archived placeholder for /api/investigate-sportsradar
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/investigate-sportsradar' }), { status: 200 });
}
