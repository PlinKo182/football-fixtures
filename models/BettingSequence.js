import mongoose from 'mongoose';

const BettingSequenceSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    index: true
  },
  currentSequence: {
    type: Number,
    default: 1,
    min: 1,
    max: 20
  },
  totalInvested: {
    type: Number,
    default: 0,
    min: 0
  },
  nextBetAmount: {
    type: Number,
    default: 0.10,
    min: 0
  },
  lastGameDate: {
    type: Date,
    required: true
  },
  lastGameResult: {
    type: String,
    enum: ['win', 'draw', 'loss', 'pending'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  defaultOdds: {
    type: Number,
    default: 3.0,
    min: 1.1
  },
  profit: {
    type: Number,
    default: 0
  },
  gamesWithoutDraw: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Martingale progression values - exact sequence from your spreadsheet
const MARTINGALE_PROGRESSION = [
  0.10, 0.18, 0.32, 0.57, 1.02, 1.78, 3.11, 5.43, 9.47, 16.52,
  28.08, 49.32, 86.31, 150.73, 263.28, 460.24, 804.42, 1407.73, 2463.52, 2000.00
];

// Calculate next bet amount based on sequence
BettingSequenceSchema.methods.calculateNextBet = function() {
  const index = Math.min(this.currentSequence - 1, MARTINGALE_PROGRESSION.length - 1);
  return MARTINGALE_PROGRESSION[index];
};

// Calculate total invested up to current sequence
BettingSequenceSchema.methods.calculateTotalInvested = function() {
  let total = 0;
  for (let i = 0; i < Math.min(this.currentSequence, MARTINGALE_PROGRESSION.length); i++) {
    total += MARTINGALE_PROGRESSION[i];
  }
  return Math.round(total * 100) / 100; // Round to 2 decimals
};

// Calculate potential profit if draw occurs
BettingSequenceSchema.methods.calculatePotentialProfit = function() {
  const totalInvested = this.calculateTotalInvested();
  const currentBet = this.calculateNextBet();
  const winnings = currentBet * this.defaultOdds;
  return Math.round((winnings - totalInvested) * 100) / 100;
};

// Reset sequence after draw
BettingSequenceSchema.methods.resetSequence = function() {
  const profit = this.calculatePotentialProfit();
  this.currentSequence = 1;
  this.totalInvested = 0;
  this.profit += profit;
  this.gamesWithoutDraw = 0;
  this.nextBetAmount = MARTINGALE_PROGRESSION[0];
  this.updatedAt = new Date();
  return this.save();
};

// Advance sequence after loss
BettingSequenceSchema.methods.advanceSequence = function() {
  if (this.currentSequence < 20) {
    this.currentSequence += 1;
    this.gamesWithoutDraw += 1;
  }
  this.totalInvested = this.calculateTotalInvested();
  this.nextBetAmount = this.calculateNextBet();
  this.updatedAt = new Date();
  return this.save();
};

// Pre-save middleware to update timestamps
BettingSequenceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get or create sequence for team
BettingSequenceSchema.statics.getOrCreateSequence = async function(teamName) {
  let sequence = await this.findOne({ teamName, isActive: true });
  
  if (!sequence) {
    sequence = new this({
      teamName,
      currentSequence: 1,
      totalInvested: 0,
      nextBetAmount: MARTINGALE_PROGRESSION[0],
      lastGameDate: new Date(),
      gamesWithoutDraw: 0
    });
    await sequence.save();
  }
  
  return sequence;
};

export default mongoose.models.BettingSequence || mongoose.model('BettingSequence', BettingSequenceSchema);
export { MARTINGALE_PROGRESSION };