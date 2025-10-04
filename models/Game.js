import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  league: {
    type: String,
    required: true,
    enum: ['La Liga', 'Ligue 1', 'Premier League']
  },
  homeTeam: {
    type: String,
    required: true
  },
  awayTeam: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'finished', 'postponed'],
    default: 'scheduled'
  },
  homeScore: {
    type: Number,
    default: null
  },
  awayScore: {
    type: Number,
    default: null
  },
  sportRadarId: {
    type: String,
    unique: true,
    sparse: true
  },
  customOdds: {
    draw: {
      type: Number,
      default: 3.0
    }
  }
}, {
  timestamps: true
});

// Índice composto para evitar jogos duplicados
GameSchema.index({ homeTeam: 1, awayTeam: 1, date: 1 }, { unique: true });

export default mongoose.models.Game || mongoose.model('Game', GameSchema);