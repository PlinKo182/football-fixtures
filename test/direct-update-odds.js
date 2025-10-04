// Directly update a game's drawOdds using the raw MongoDB collection (updateOne with arrayFilters)
const { MongoClient } = require('mongodb');

const APOSTAS_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Apostas?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(APOSTAS_URI, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db();
  const collection = db.collection('laliga_2025_26');

  const teamName = 'Atl. Bilbao';
  const targetDateISO = new Date('2025-08-17T17:30:00.000Z').toISOString();
  const opponent = 'Sevilha';
  const newOdds = 9.9;

  console.log('Before update:');
  const before = await collection.findOne({ teamName }, { projection: { games: 1 } });
  if (!before) {
    console.log('Team not found');
    await client.close();
    return;
  }
  const foundBefore = (before.games || []).filter(g => new Date(g.date).toISOString() === targetDateISO);
  console.log('Matches found before:', foundBefore.map(g => ({ opponent: g.opponent || g.awayTeam || g.homeTeam, drawOdds: g.drawOdds })));

  // Perform arrayFilter update
  const res = await collection.updateOne(
    { teamName },
    { $set: { 'games.$[elem].drawOdds': newOdds } },
    { arrayFilters: [ { 'elem.opponent': opponent } ] }
  );

  console.log('updateOne result:', res.result || res);

  console.log('After update (raw read):');
  const after = await collection.findOne({ teamName }, { projection: { games: 1 } });
  const foundAfter = (after.games || []).filter(g => new Date(g.date).toISOString() === targetDateISO);
  console.log('Matches found after:', foundAfter.map(g => ({ opponent: g.opponent || g.awayTeam || g.homeTeam, drawOdds: g.drawOdds })));

  await client.close();
}

if (require.main === module) run().catch(e => { console.error(e); process.exit(1); });
