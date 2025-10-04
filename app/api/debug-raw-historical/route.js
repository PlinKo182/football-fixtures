import connectToDatabase from '../../../lib/mongodb.js';
import { getHistoricalModel } from '../../../lib/historicalDataLoader.js';

export async function GET() {
  return new Response(JSON.stringify({
    success: false,
    error: 'This debug route has been archived. See app/api/archive/debug-raw-historical/route.js'
  }), { status: 410, headers: { 'Content-Type': 'application/json' } });
}