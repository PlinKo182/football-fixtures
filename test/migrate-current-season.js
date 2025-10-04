// Script para migrar dados da época atual (2025-26) para base "Apostas"
// Copia jogos atuais da base Empates para Apostas com drawOdds=3.0 por defeito
const mongoose = require('mongoose');

// URLs das bases de dados
const EMPATES_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Empates?retryWrites=true&w=majority&appName=Cluster0';
const APOSTAS_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Apostas?retryWrites=true&w=majority&appName=Cluster0';

// Schema flexível para ambas as bases
const TeamSchema = new mongoose.Schema({}, { strict: false });

async function migrateCurrentSeason() {
  console.log('🚀 MIGRAÇÃO ÉPOCA ATUAL (2025-26) PARA BASE "APOSTAS"');
  console.log('═'.repeat(60));
  
  try {
    // Conectar à base EMPATES (origem)
    console.log('🔌 Conectando à base EMPATES...');
    const empatesConnection = mongoose.createConnection(EMPATES_URI);
    await empatesConnection.asPromise();
    console.log('✅ Conectado à base EMPATES');
    
    // Conectar à base APOSTAS (destino)
    console.log('🔌 Conectando à base APOSTAS...');
    const apostasConnection = mongoose.createConnection(APOSTAS_URI);
    await apostasConnection.asPromise();
    console.log('✅ Conectado à base APOSTAS');
    
    // Modelos para época atual (2025-26)
    const sourceModels = {
      laliga_2025_26: empatesConnection.model('LaLiga2025', TeamSchema, 'laliga_2025_26'),
      ligue1_2025_26: empatesConnection.model('Ligue1_2025', TeamSchema, 'ligue1_2025_26'),
      premierleague_2025_26: empatesConnection.model('Premier2025', TeamSchema, 'premierleague_2025_26')
    };
    
    const targetModels = {
      laliga_2025_26: apostasConnection.model('LaLiga2025', TeamSchema, 'laliga_2025_26'),
      ligue1_2025_26: apostasConnection.model('Ligue1_2025', TeamSchema, 'ligue1_2025_26'),
      premierleague_2025_26: apostasConnection.model('Premier2025', TeamSchema, 'premierleague_2025_26')
    };
    
    const ligas = ['laliga_2025_26', 'ligue1_2025_26', 'premierleague_2025_26'];
    let totalJogosMigrados = 0;
    let totalEquipasMigradas = 0;
    
    for (const liga of ligas) {
      console.log(`\n🏆 PROCESSANDO: ${liga.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      // Buscar todas as equipas da liga na base Empates
      const equipasOriginais = await sourceModels[liga].find({});
      console.log(`📊 Encontradas ${equipasOriginais.length} equipas em ${liga}`);
      
      if (equipasOriginais.length === 0) {
        console.log(`⚠️ Nenhuma equipa encontrada em ${liga}, passando para próxima...`);
        continue;
      }
      
      // Verificar se já existem dados na base Apostas
      const equipasExistentes = await targetModels[liga].find({});
      console.log(`🔍 Equipas já existentes na base Apostas: ${equipasExistentes.length}`);
      
      let equipasMigradas = 0;
      let jogosMigrados = 0;
      
      for (const equipaOriginal of equipasOriginais) {
        console.log(`\n⚽ Processando equipa: ${equipaOriginal.teamName}`);
        
        // Verificar se esta equipa já existe na base Apostas
        const equipaExistente = await targetModels[liga].findOne({ 
          teamName: equipaOriginal.teamName 
        });
        
        if (equipaExistente) {
          console.log(`  🔄 Equipa ${equipaOriginal.teamName} já existe, atualizando com odds...`);
          
          // Atualizar jogos existentes com odds
          const jogosComOdds = equipaExistente.games ? equipaExistente.games.map(game => ({
            ...game,
            drawOdds: game.drawOdds || 3.0, // Só adiciona se não tiver
            hasOdds: true
          })) : [];
          
          // Adicionar novos jogos da base Empates se existirem
          if (equipaOriginal.games && Array.isArray(equipaOriginal.games)) {
            for (const novoJogo of equipaOriginal.games) {
              // Verificar se este jogo já existe (por data e adversário)
              const jogoExistente = jogosComOdds.find(j => 
                j.date?.getTime() === new Date(novoJogo.date).getTime() && 
                j.opponent === novoJogo.opponent
              );
              
              if (!jogoExistente) {
                  // Determine drawOdds: null for future/scheduled games, otherwise keep existing or calculate default
                  const jogoDate = novoJogo.date ? new Date(novoJogo.date) : null;
                  const now = new Date();
                  const isFuture = jogoDate && !isNaN(jogoDate.getTime()) && jogoDate > now;

                  const drawOddsValue = (novoJogo.status === 'scheduled' || isFuture) ? null : (novoJogo.drawOdds || 3.0);

                  jogosComOdds.push({
                    ...novoJogo,
                    drawOdds: drawOddsValue,
                    hasOdds: typeof drawOddsValue === 'number'
                  });
                console.log(`    ➕ Novo jogo adicionado: vs ${novoJogo.opponent}`);
              }
            }
          }
          
          // Atualizar na base de dados
          await targetModels[liga].updateOne(
            { teamName: equipaOriginal.teamName },
            { $set: { games: jogosComOdds } }
          );
          
          equipasMigradas++;
          jogosMigrados += jogosComOdds.length;
          console.log(`  ✅ Equipa ${equipaOriginal.teamName} atualizada com ${jogosComOdds.length} jogos`);
          continue;
        }
        
        // Criar nova equipa para base Apostas
        const novaEquipa = {
          ...equipaOriginal.toObject(),
          _id: undefined, // Permitir que MongoDB gere novo ID
        };
        
        // Ajustar drawOdds: manter null para jogos futuros/agendados, definir odds para jogos passados ou com resultado
        if (novaEquipa.games && Array.isArray(novaEquipa.games)) {
          novaEquipa.games = novaEquipa.games.map(game => {
            const jogoDate = game.date ? new Date(game.date) : null;
            const now = new Date();
            const isFuture = jogoDate && !isNaN(jogoDate.getTime()) && jogoDate > now;

            const drawOddsValue = (game.status === 'scheduled' || isFuture) ? null : (game.drawOdds || 3.0);

            return {
              ...game,
              drawOdds: drawOddsValue,
              hasOdds: typeof drawOddsValue === 'number'
            };
          });

          jogosMigrados += novaEquipa.games.length;
          console.log(`  📈 Processadas ${novaEquipa.games.length} jogos (odds aplicadas quando relevantes)`);
        }
        
        // Salvar na base Apostas
        try {
          const equipaSalva = new targetModels[liga](novaEquipa);
          await equipaSalva.save();
          equipasMigradas++;
          console.log(`  ✅ Equipa ${equipaOriginal.teamName} migrada com sucesso`);
        } catch (error) {
          console.error(`  ❌ Erro ao salvar equipa ${equipaOriginal.teamName}:`, error.message);
        }
      }
      
      totalEquipasMigradas += equipasMigradas;
      totalJogosMigrados += jogosMigrados;
      
      console.log(`\n📊 RESUMO ${liga.toUpperCase()}:`);
      console.log(`   • Equipas migradas: ${equipasMigradas}`);
      console.log(`   • Jogos com odds adicionadas: ${jogosMigrados}`);
    }
    
    console.log('\n🎯 RESUMO FINAL DA MIGRAÇÃO:');
    console.log('═'.repeat(40));
    console.log(`✅ Total de equipas migradas: ${totalEquipasMigradas}`);
    console.log(`🎲 Total de jogos com odds: ${totalJogosMigrados}`);
    console.log(`📅 Época migrada: 2025-26`);
    console.log(`🎯 Odds padrão aplicadas: 3.0`);
    
    // Fechar conexões
    await empatesConnection.close();
    await apostasConnection.close();
    console.log('\n🔌 Conexões fechadas');
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar migração
if (require.main === module) {
  migrateCurrentSeason()
    .then(() => {
      console.log('\n🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateCurrentSeason };