// archived placeholder for /api/fixed-import
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/fixed-import' }), { status: 200 });
}
