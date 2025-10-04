// Script para alterar odds de teste na base Apostas
// Muda algumas odds para valores diferentes para testar o sistema
const mongoose = require('mongoose');

const APOSTAS_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Apostas?retryWrites=true&w=majority&appName=Cluster0';

// Schema flexível
const TeamSchema = new mongoose.Schema({}, { strict: false });

async function alterarOddsTest() {
  console.log('🎲 ALTERANDO ODDS PARA TESTE');
  console.log('═'.repeat(40));
  
  try {
    // Conectar à base APOSTAS
    console.log('🔌 Conectando à base APOSTAS...');
    const apostasConnection = mongoose.createConnection(APOSTAS_URI);
    await apostasConnection.asPromise();
    console.log('✅ Conectado à base APOSTAS');
    
    // Modelos da época atual
    const models = {
      laliga_2025_26: apostasConnection.model('LaLiga2025', TeamSchema, 'laliga_2025_26'),
      ligue1_2025_26: apostasConnection.model('Ligue1_2025', TeamSchema, 'ligue1_2025_26'),
      premierleague_2025_26: apostasConnection.model('Premier2025', TeamSchema, 'premierleague_2025_26')
    };
    
    // Odds de teste variadas
    const oddsTest = [2.8, 3.2, 3.5, 3.7, 4.1, 2.9, 3.3, 3.6, 3.8, 4.0];
    let totalAlteracoes = 0;
    
    // Alterar odds em cada liga
    for (const [liga, model] of Object.entries(models)) {
      console.log(`\n🏆 Processando: ${liga.toUpperCase()}`);
      
      const equipas = await model.find({});
      console.log(`📊 Encontradas ${equipas.length} equipas`);
      
      for (const equipa of equipas) {
        if (equipa.games && Array.isArray(equipa.games)) {
          let alteracoesEquipa = 0;
          
          // Alterar odds de alguns jogos aleatoriamente
          equipa.games = equipa.games.map((game, index) => {
            // Alterar odds de 30% dos jogos aleatoriamente
            if (Math.random() < 0.3) {
              const novaOdd = oddsTest[Math.floor(Math.random() * oddsTest.length)];
              game.drawOdds = novaOdd;
              game.hasOdds = true;
              alteracoesEquipa++;
              totalAlteracoes++;
            }
            return game;
          });
          
          // Salvar as alterações
          if (alteracoesEquipa > 0) {
            await model.updateOne(
              { _id: equipa._id },
              { $set: { games: equipa.games } }
            );
            console.log(`  ✅ ${equipa.teamName}: ${alteracoesEquipa} jogos com odds alteradas`);
          }
        }
      }
    }
    
    console.log('\n🎯 RESUMO DAS ALTERAÇÕES:');
    console.log('═'.repeat(30));
    console.log(`✅ Total de jogos alterados: ${totalAlteracoes}`);
    console.log(`🎲 Odds aplicadas: ${oddsTest.join(', ')}`);
    console.log(`📊 Percentagem alterada: ~30% dos jogos`);
    
    // Fechar conexão
    await apostasConnection.close();
    console.log('\n🔌 Conexão fechada');
    console.log('✅ ALTERAÇÃO DE ODDS CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ Erro durante alteração:', error);
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  alterarOddsTest()
    .then(() => {
      console.log('\n🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { alterarOddsTest };