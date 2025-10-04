// archived placeholder for /api/diagnose-parsing
// original file removed from app/api to avoid build-time compilation of debug routes
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/diagnose-parsing' }), { status: 200 });
}
// Archived copy of app/api/diagnose-parsing/route.js

export async function GET() {
  return new Response(JSON.stringify({ archived: true, message: 'diagnose-parsing archived' }), { status: 410 });
}
