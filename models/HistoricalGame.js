import mongoose from 'mongoose';

const HistoricalGameSchema = new mongoose.Schema({
  // Dados básicos do jogo (copiados de Game)
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
  
  // Resultado final (obrigatório para jogos históricos)
  homeScore: {
    type: Number,
    required: true
  },
  awayScore: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'finished'
  },
  
  // ODDS DE EMPATE - OBRIGATÓRIAS PARA TODOS OS JOGOS
  // Cada jogo precisa de odds porque apostamos em TODOS os jogos
  drawOdds: {
    type: Number,
    required: true,
    default: 3.0,
    min: 1.01,
    max: 50.0
  },
  
  // ODDS PERSONALIZADAS POR EQUIPA (opcional para casos específicos)
  teamOdds: {
    type: Map,
    of: {
      draw: {
        type: Number,
        default: 3.0
      }
    }
  },
  
  // Metadados para tracking
  season: {
    type: String,
    required: true // Ex: "2024-25"
  },
  originalGameId: {
    type: String // Referência ao Game original do SportRadar
  },
  sportRadarId: {
    type: String
  },
  migratedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para performance
HistoricalGameSchema.index({ homeTeam: 1, awayTeam: 1, date: 1 }, { unique: true });
HistoricalGameSchema.index({ season: 1 });
HistoricalGameSchema.index({ league: 1, season: 1 });

// Helper para calcular temporada baseado na data
HistoricalGameSchema.statics.calculateSeason = function(gameDate) {
  const date = new Date(gameDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Se o jogo é antes de Julho, pertence à temporada anterior
  if (month < 7) {
    return `${year - 1}-${String(year).slice(-2)}`;
  } else {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
};

// Helper para obter odds de empate do jogo
HistoricalGameSchema.methods.getDrawOdds = function() {
  return this.drawOdds || 3.0;
};

// Helper para obter odds de uma equipa específica (se existir customização)
HistoricalGameSchema.methods.getTeamOdds = function(teamName) {
  if (this.teamOdds && this.teamOdds.has(teamName)) {
    return this.teamOdds.get(teamName);
  }
  return { draw: this.drawOdds || 3.0 }; // Usar drawOdds como fallback
};

export default mongoose.models.HistoricalGame || mongoose.model('HistoricalGame', HistoricalGameSchema);