// Archived copy of app/api/clean-current-data/route.js

export async function GET() {
  return new Response(JSON.stringify({ archived: true, message: 'clean-current-data archived' }), { status: 410 });
}
