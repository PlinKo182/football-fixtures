// Archived copy of app/api/clear-cache/route.js

export async function POST() {
  return new Response(JSON.stringify({ archived: true, message: 'clear-cache archived' }), { status: 410 });
}
