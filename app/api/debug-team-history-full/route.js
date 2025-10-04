export async function GET() {
  return new Response(JSON.stringify({
    success: false,
    error: 'This debug route has been archived. See app/api/archive/debug-team-history-full/route.js'
  }), { status: 410, headers: { 'Content-Type': 'application/json' } });
}
