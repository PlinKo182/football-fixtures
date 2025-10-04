import { NextResponse } from 'next/server';
import { getTeamGamesWithHistory } from '@/lib/teamLoader';

export async function GET() {
  return new Response(JSON.stringify({ success: false, error: 'archived' }), { status: 410, headers: { 'Content-Type': 'application/json' } });
}
