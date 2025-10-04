// Archived copy of app/api/check-game-status/route.js

// Long debug endpoint archived for reference

export async function GET() {
  return new Response(JSON.stringify({ archived: true, message: 'check-game-status archived' }), { status: 410 });
}
