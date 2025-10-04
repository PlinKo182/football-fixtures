// Inspect how getTeamGamesWithHistory returns drawOdds vs raw Apostas DB values
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Empates?retryWrites=true&w=majority&appName=Cluster0';

import { getTeamGamesWithHistory } from '../lib/teamLoader.js';
import mongoose from 'mongoose';

async function rawApostas(teamName) {
  const APOSTAS_URI = process.env.MONGODB_URI.replace('/Empates', '/Apostas');
  const conn = mongoose.createConnection(APOSTAS_URI);
  await conn.asPromise();
  const TeamSchema = new mongoose.Schema({}, { strict: false });
  const modelName = 'laliga_2025_26';
  const M = conn.model(modelName, TeamSchema);
  const doc = await M.findOne({ teamName }).lean();
  await conn.close();
  return doc;
}

(async () => {
  const teamName = 'Atl. Bilbao';
  console.log('Calling loader...');
  const loaded = await getTeamGamesWithHistory(teamName, true);
  console.log('Loader returned games count:', loaded.games.length);
  const sample = loaded.games.slice(0,10).map(g => ({ date: g.date, opponent: g.opponent, status: g.status, drawOdds: g.drawOdds, hasOdds: g.hasOdds }));
  console.log('Loader sample:', sample);

  console.log('\nReading raw Apostas doc...');
  const raw = await rawApostas(teamName);
  console.log('Raw aposta games sample (first 10):', (raw.games || []).slice(0,10).map(g => ({ date: g.date, opponent: g.opponent, status: g.status, drawOdds: g.drawOdds })));

  // Find mismatches where loader shows 3 but raw has null
  const mismatches = [];
  for (const g of loaded.games) {
    const rawMatch = (raw.games || []).find(r => new Date(r.date).toISOString() === new Date(g.date).toISOString() && (r.opponent === g.opponent));
    if (rawMatch && rawMatch.drawOdds !== g.drawOdds) {
      mismatches.push({ date: g.date, opponent: g.opponent, raw: rawMatch.drawOdds, loader: g.drawOdds });
    }
  }
  console.log('\nMismatches (raw vs loader):', mismatches.slice(0,10));

  process.exit(0);
})();
