import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BettingSequence from '@/models/BettingSequence';

// GET - Get all active betting sequences
export async function GET() {
  try {
    await connectToDatabase();
    
    const sequences = await BettingSequence.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .lean();
    
    // Calculate current values for each sequence
    const enrichedSequences = sequences.map(seq => {
      const sequence = new BettingSequence(seq);
      return {
        ...seq,
        nextBetAmount: sequence.calculateNextBet(),
        totalInvested: sequence.calculateTotalInvested(),
        potentialProfit: sequence.calculatePotentialProfit()
      };
    });
    
    return NextResponse.json({
      success: true,
      sequences: enrichedSequences
    });
    
  } catch (error) {
    console.error('❌ Error fetching betting sequences:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update betting sequence
export async function POST(request) {
  try {
    await connectToDatabase();
    
    const { teamName, action, gameResult, odds } = await request.json();
    
    if (!teamName) {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      );
    }
    
    // Get or create sequence
    let sequence = await BettingSequence.getOrCreateSequence(teamName);
    
    // Update odds if provided
    if (odds && odds > 1.1) {
      sequence.defaultOdds = odds;
    }
    
    // Handle different actions
    switch (action) {
      case 'bet':
        // Just update the sequence for next bet (advance sequence)
        await sequence.advanceSequence();
        break;
        
      case 'result':
        if (gameResult === 'draw') {
          // Draw occurred - reset sequence
          await sequence.resetSequence();
        } else if (gameResult === 'loss') {
          // Lost bet - advance sequence
          await sequence.advanceSequence();
        }
        sequence.lastGameResult = gameResult;
        sequence.lastGameDate = new Date();
        await sequence.save();
        break;
        
      case 'reset':
        // Manual reset
        await sequence.resetSequence();
        break;
        
      default:
        // Just update odds or get current state
        if (odds) {
          await sequence.save();
        }
    }
    
    // Return updated sequence with calculated values
    const result = {
      ...sequence.toObject(),
      nextBetAmount: sequence.calculateNextBet(),
      totalInvested: sequence.calculateTotalInvested(),
      potentialProfit: sequence.calculatePotentialProfit()
    };
    
    return NextResponse.json({
      success: true,
      sequence: result
    });
    
  } catch (error) {
    console.error('❌ Error updating betting sequence:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}