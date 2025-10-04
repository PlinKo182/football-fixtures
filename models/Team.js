import mongoose from 'mongoose';

// Schema para um jogo individual
const GameSchema = new mongoose.Schema({
  opponent: {
    type: String,
    required: true
  },
  // Odds for a draw (Apostas database / protected field)
  drawOdds: {
    type: Number,
    default: null
  },
  isHome: {
    type: Boolean,
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
    enum: ['scheduled', 'live', 'finished'],
    default: 'scheduled'
  },
  teamScore: {
    type: Number,
    default: null
  },
  opponentScore: {
    type: Number,
    default: null
  },
  sportRadarId: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
});

// Schema para uma equipa (documento principal)
const TeamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true
  },
  league: {
    type: String,
    required: true
  },
  games: [GameSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Função para obter o modelo da liga com época
export function getLeagueModel(leagueName, season = '2025-26') {
  // Normalizar o nome da liga para usar como nome da coleção
  const baseName = leagueName.replace(/\s+/g, '').toLowerCase();
  const seasonSuffix = season.replace('-', '_');
  const collectionName = `${baseName}_${seasonSuffix}`;
  
  // Verificar se o modelo já existe
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }
  
  // Criar e retornar o modelo
  return mongoose.model(collectionName, TeamSchema, collectionName);
}

// Função para compatibilidade com código existente (época atual)
export function getLeagueModelCurrent(leagueName) {
  return getLeagueModel(leagueName, '2025-26');
}

// Função para dados históricos
export function getLeagueModelHistorical(leagueName, season = '2024-25') {
  return getLeagueModel(leagueName, season);
}

export default TeamSchema;