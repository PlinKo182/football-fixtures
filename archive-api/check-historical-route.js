// Archived copy of app/api/check-historical/route.js

export async function GET() {
  return new Response(JSON.stringify({ archived: true, message: 'check-historical archived' }), { status: 410 });
}
