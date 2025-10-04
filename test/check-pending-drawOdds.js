// Script para listar jogos scheduled/pending e mostrar drawOdds
const { MongoClient } = require('mongodb');
const EMPATES_URI = process.env.MONGODB_URI;
if (!EMPATES_URI) {
  console.error('Defina MONGODB_URI antes de correr o script');
  process.exit(1);
}
const APOSTAS_URI = EMPATES_URI.replace('/Empates', '/Apostas');

(async function(){
  const client = new MongoClient(APOSTAS_URI);
  await client.connect();
  const db = client.db();
  const cols = await db.listCollections().toArray();
  const seasonCols = cols.map(c=>c.name).filter(n=>n.endsWith('_2025_26'));
  console.log('Season collections:', seasonCols.join(', '));
  for (const coll of seasonCols) {
    const collection = db.collection(coll);
    const docs = await collection.find({ 'games.status': { $in: ['scheduled','pending'] } }).limit(5).toArray();
    if (docs.length===0) continue;
    console.log('\nCollection:', coll);
    for (const d of docs) {
      const pending = (d.games || []).filter(g=>['scheduled','pending'].includes(g.status));
      console.log(' Team:', d.teamName, 'pending matches:', pending.length);
      for (const p of pending.slice(0,3)) {
        console.log('  ->', { opponent: p.opponent || p.awayTeam || p.homeTeam, date: p.date, status: p.status, drawOdds: p.drawOdds });
      }
    }
  }
  await client.close();
})();
