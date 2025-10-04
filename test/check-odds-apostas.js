// Script rápido para checar drawOdds de um jogo na base Apostas
const mongoose = require('mongoose');

const APOSTAS_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Apostas?retryWrites=true&w=majority&appName=Cluster0';
const TeamSchema = new mongoose.Schema({}, { strict: false });

async function check() {
  const conn = mongoose.createConnection(APOSTAS_URI);
  await conn.asPromise();
  const model = conn.model('LaLiga2025', TeamSchema, 'laliga_2025_26');
  const team = await model.findOne({ teamName: 'Atl. Bilbao' }).lean();
  if (!team) {
    console.log('Team not found in Apostas');
    await conn.close();
    return;
  }
  console.log('Team games count (Apostas):', team.games?.length);
  const targetDate = new Date('2025-08-17T17:30:00.000Z').toISOString();
  const found = team.games.filter(g => new Date(g.date).toISOString() === targetDate && (g.opponent === 'Sevilha' || g.homeTeam === 'Atl. Bilbao' || g.awayTeam === 'Sevilha'));
  console.log('Matches found matching date/opponent:', found.length);
  found.forEach((g, i) => {
    console.log(`--- Match ${i} ---`);
    console.log('opponent:', g.opponent);
    console.log('isHome:', g.isHome);
    console.log('homeTeam:', g.homeTeam);
    console.log('awayTeam:', g.awayTeam);
    console.log('date:', new Date(g.date).toISOString());
    console.log('drawOdds:', g.drawOdds);
  });
  await conn.close();
}

if (require.main === module) check().catch(e => { console.error(e); process.exit(1); });