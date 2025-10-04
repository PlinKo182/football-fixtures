import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  opponent: String,
  isHome: Boolean,
  date: Date,
  time: String,
  status: String,
  teamScore: Number,
  opponentScore: Number,
  sportRadarId: String
});

const TeamSchema = new mongoose.Schema({
  teamName: String,
  league: String,
  games: [GameSchema],
  lastUpdated: { type: Date, default: Date.now }
});

function getLeagueModel(leagueName) {
  const collectionName = leagueName.replace(/\s+/g, '').toLowerCase();
  
  if (mongoose.models[collectionName]) {
    delete mongoose.models[collectionName];
  }
  
  return mongoose.model(collectionName, TeamSchema, collectionName);
}

export async function GET() {
  try {
    console.log('🔍 API Test Data - Starting...');
    
    await connectToDatabase();
    console.log('✅ Connected to database');
    
    const leagues = [
      { name: 'La Liga', collection: 'laliga' },
      { name: 'Premier League', collection: 'premierleague' },
      { name: 'Ligue 1', collection: 'ligue1' }
    ];
    
    const allGames = {};
    
    for (const league of leagues) {
      console.log(`📊 Processing ${league.name}...`);
      
      const Model = getLeagueModel(league.name);
      const teams = await Model.find({}).lean().limit(2); // Limit para teste
      
      console.log(`   Found ${teams.length} teams`);
      
      allGames[league.name] = teams.map(team => ({
        teamName: team.teamName,
        league: team.league || league.name,
        gamesCount: team.games.length,
        games: team.games.slice(0, 3) // Só primeiros 3 jogos para teste
      }));
    }
    
    console.log('✅ Data processed successfully');
    
    return Response.json({
      success: true,
      data: allGames,
      leagues: Object.keys(allGames),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}