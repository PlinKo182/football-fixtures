// archived placeholder for /api/clear-cache
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/clear-cache' }), { status: 200 });
}
// Archived copy of app/api/clear-cache/route.js

export async function POST() {
  return new Response(JSON.stringify({ archived: true, message: 'clear-cache archived' }), { status: 410 });
}
