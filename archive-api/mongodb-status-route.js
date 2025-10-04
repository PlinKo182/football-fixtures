// archived placeholder for /api/mongodb-status
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/mongodb-status' }), { status: 200 });
}
