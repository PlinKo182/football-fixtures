// Script de migração: define drawOdds = null para jogos agendados (status 'scheduled' ou 'pending')
// Uso: node test/migrate-set-pending-drawOdds-null.js [--season=2025_26] [--includeHistorical]

const { MongoClient } = require('mongodb');
const argv = require('minimist')(process.argv.slice(2));

const seasonArg = argv.season || '2025_26';
const includeHistorical = !!argv.includeHistorical;

const EMPATES_URI = process.env.MONGODB_URI;
if (!EMPATES_URI) {
  console.error('ERRO: defina a variável de ambiente MONGODB_URI apontando para a base Empates.');
  process.exit(1);
}
const APOSTAS_URI = EMPATES_URI.replace('/Empates', '/Apostas');

async function run() {
  const client = new MongoClient(APOSTAS_URI);
  await client.connect();
  const db = client.db();

  console.log('Conectado a Apostas:', APOSTAS_URI);

  // Listar coleções e filtrar por época
  const allCollections = await db.listCollections().toArray();
  const seasonSuffix = seasonArg; // e.g. 2025_26

  const targetCollections = allCollections
    .map(c => c.name)
    .filter(name => name.endsWith(`_${seasonSuffix}`));

  if (includeHistorical) {
    // also include previous season if requested (for safety we include any matching pattern)
    const hist = allCollections
      .map(c => c.name)
      .filter(name => name.endsWith(`_2024_25`) || name.endsWith(`_2023_24`));
    for (const h of hist) if (!targetCollections.includes(h)) targetCollections.push(h);
  }

  if (targetCollections.length === 0) {
    console.log('Nenhuma coleção encontrada para a época solicitada:', seasonSuffix);
    await client.close();
    return;
  }

  console.log('Coleções alvo:', targetCollections.join(', '));

  // For each collection, update games elements with status scheduled|pending to have drawOdds=null
  for (const collName of targetCollections) {
    const collection = db.collection(collName);
    console.log('\nProcessando coleção:', collName);

    // Two steps: 1) set drawOdds = null for elements with status 'scheduled' or 'pending'
    const res = await collection.updateMany(
      {},
      { $set: { 'games.$[g].drawOdds': null } },
      { arrayFilters: [ { 'g.status': { $in: ['scheduled', 'pending'] } } ] }
    );

    console.log(`updateMany matchedCount=${res.matchedCount} modifiedCount=${res.modifiedCount}`);

    // Optional: for visibility, sample a team that had matches updated
    const sample = await collection.findOne({ 'games.status': { $in: ['scheduled', 'pending'] } }, { projection: { teamName: 1, games: 1 } });
    if (sample) {
      const updatedGames = (sample.games || []).filter(g => ['scheduled','pending'].includes(g.status));
      console.log('Exemplo (team):', sample.teamName, 'jogos agendados encontrados no documento:', updatedGames.length);
      if (updatedGames.length > 0) console.log('Exemplo primeiro jogo:', { opponent: updatedGames[0].opponent, date: updatedGames[0].date, status: updatedGames[0].status, drawOdds: updatedGames[0].drawOdds });
    } else {
      console.log('Nenhum documento de exemplo com jogos scheduled/pending encontrado (ou já atualizado).');
    }
  }

  await client.close();
  console.log('\nMigração concluída.');
}

run().catch(err => { console.error('Erro na migração:', err); process.exit(1); });
