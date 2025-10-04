import { calculateCurrentBettingState } from '@/lib/bettingCalculator';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get('team');
    
    if (!teamName) {
      return Response.json({ error: 'Team name is required' }, { status: 400 });
    }
    
    const bettingState = await calculateCurrentBettingState(teamName);
    
    return Response.json({
      success: true,
      bettingState
    });
    
  } catch (error) {
    console.error('Error calculating betting state:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}