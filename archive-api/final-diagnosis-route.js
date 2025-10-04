// archived placeholder for /api/final-diagnosis
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/final-diagnosis' }), { status: 200 });
}
