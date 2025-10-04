// Archived copy of app/api/edit-odds/route.js

export async function PUT(req) {
  return new Response(JSON.stringify({ archived: true, message: 'edit-odds archived' }), { status: 410 });
}
