// archived placeholder for /api/investigate-status
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/investigate-status' }), { status: 200 });
}
