// Archived copy of app/api/diagnose-parsing/route.js

export async function GET() {
  return new Response(JSON.stringify({ archived: true, message: 'diagnose-parsing archived' }), { status: 410 });
}
