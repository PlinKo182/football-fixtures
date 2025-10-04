import { getAllGames } from '../../../lib/dataLoader.js';

export async function GET() {
  const all = await getAllGames();
  return Response.json({ success: true, leagues: Object.keys(all) });
}
