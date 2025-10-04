// Force update a game's drawOdds directly in Apostas DB and verify
const mongoose = require('mongoose');
const APOSTAS_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Apostas?retryWrites=true&w=majority&appName=Cluster0';
const TeamSchema = new mongoose.Schema({}, { strict: false });

async function run() {
  const conn = mongoose.createConnection(APOSTAS_URI);
  await conn.asPromise();
  const model = conn.model('LaLiga2025', TeamSchema, 'laliga_2025_26');
  const team = await model.findOne({ teamName: 'Atl. Bilbao' });
  if (!team) {
    console.log('Team not found');
    await conn.close();
    return;
  }
  const targetDate = new Date('2025-08-17T17:30:00.000Z').toISOString();
  const idx = team.games.findIndex(g => new Date(g.date).toISOString() === targetDate && (g.opponent === 'Sevilha' || g.homeTeam === 'Atl. Bilbao' || g.awayTeam === 'Sevilha'));
  console.log('Found index:', idx);
  if (idx >= 0) {
    team.games[idx].drawOdds = 4.2;
    await team.save();
    console.log('Saved. Now reloading...');
    const fresh = await model.findOne({ teamName: 'Atl. Bilbao' }).lean();
    const found = fresh.games.filter(g => new Date(g.date).toISOString() === targetDate);
    console.log('After save, drawOdds:', found.map(f=>f.drawOdds));
  } else {
    console.log('Match not found');
  }
  await conn.close();
}

if (require.main === module) run().catch(e=>{console.error(e); process.exit(1);});