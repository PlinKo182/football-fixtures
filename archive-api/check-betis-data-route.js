// Archived copy of app/api/check-betis-data/route.js

import connectToDatabase from '../../../lib/mongodb.js';
import Game from '../../../models/Game.js';

export async function GET() {
  try {
    await connectToDatabase();
    return Response.json({ success: true, message: 'Archived check-betis-data' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
