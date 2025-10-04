// Archived copy of app/api/fix-existing-data/route.js

export async function GET() {
  return new Response(JSON.stringify({ archived: true, message: 'fix-existing-data archived' }), { status: 410 });
}
