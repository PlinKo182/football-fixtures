// archived placeholder for /api/check-historical
export default function handler() {
  return new Response(JSON.stringify({ archived: true, route: '/api/check-historical' }), { status: 200 });
}
// Archived copy of app/api/check-historical/route.js

export async function GET() {
  return new Response(JSON.stringify({ archived: true, message: 'check-historical archived' }), { status: 410 });
}
