// Script to populate betting sequences for testing
import mongoose from 'mongoose';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/football-fixtures';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Betting Sequence Schema (copy from model)
const BettingSequenceSchema = new mongoose.Schema({
  teamName: { type: String, required: true, index: true },
  currentSequence: { type: Number, default: 1, min: 1, max: 20 },
  totalInvested: { type: Number, default: 0, min: 0 },
  nextBetAmount: { type: Number, default: 0.10, min: 0 },
  lastGameDate: { type: Date, required: true },
  lastGameResult: { type: String, enum: ['win', 'draw', 'loss', 'pending'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  defaultOdds: { type: Number, default: 3.0, min: 1.1 },
  profit: { type: Number, default: 0 },
  gamesWithoutDraw: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MARTINGALE_PROGRESSION = [
  0.10, 0.17, 0.28, 0.48, 0.80, 1.35, 2.28, 3.84, 6.47, 10.90,
  18.35, 30.91, 52.05, 87.66, 147.63, 248.63, 418.72, 705.16, 1187.57, 2000.00
];

BettingSequenceSchema.methods.calculateNextBet = function() {
  const index = Math.min(this.currentSequence - 1, MARTINGALE_PROGRESSION.length - 1);
  return MARTINGALE_PROGRESSION[index];
};

BettingSequenceSchema.methods.calculateTotalInvested = function() {
  let total = 0;
  for (let i = 0; i < Math.min(this.currentSequence, MARTINGALE_PROGRESSION.length); i++) {
    total += MARTINGALE_PROGRESSION[i];
  }
  return Math.round(total * 100) / 100;
};

BettingSequenceSchema.methods.calculatePotentialProfit = function() {
  const nextBet = this.calculateNextBet();
  const totalWithNextBet = this.calculateTotalInvested() + nextBet;
  const potentialWin = nextBet * this.defaultOdds;
  return Math.round((potentialWin - totalWithNextBet) * 100) / 100;
};

const BettingSequence = mongoose.models.BettingSequence || mongoose.model('BettingSequence', BettingSequenceSchema);

async function populateTestData() {
  await connectDB();
  
  // Sample data matching your image
  const testSequences = [
    {
      teamName: 'Toulouse FC',
      currentSequence: 1,
      totalInvested: 0.00,
      lastGameDate: new Date('2025-10-05T14:00:00'),
      lastGameResult: 'pending',
      defaultOdds: 3.0,
      profit: 0,
      gamesWithoutDraw: 0
    },
    {
      teamName: 'Brighton & Hove Albion FC',
      currentSequence: 2,
      totalInvested: 0.10,
      lastGameDate: new Date('2025-10-05T14:00:00'),
      lastGameResult: 'loss',
      defaultOdds: 3.0,
      profit: 0,
      gamesWithoutDraw: 1
    }
  ];
  
  // Clear existing data
  await BettingSequence.deleteMany({});
  console.log('🗑️ Cleared existing betting sequences');
  
  // Insert test data
  for (const seqData of testSequences) {
    const sequence = new BettingSequence(seqData);
    sequence.nextBetAmount = sequence.calculateNextBet();
    sequence.totalInvested = sequence.calculateTotalInvested();
    await sequence.save();
    
    console.log(`✅ Created sequence for ${sequence.teamName}: #${sequence.currentSequence} - €${sequence.nextBetAmount}`);
  }
  
  console.log('🎯 Test data populated successfully!');
  process.exit(0);
}

populateTestData().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});