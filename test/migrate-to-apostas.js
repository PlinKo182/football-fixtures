// Script para migrar dados históricos para nova base "Apostas"
// Mantém estrutura existente + adiciona drawOdds a cada jogo
const mongoose = require('mongoose');

// URLs das bases de dados
const EMPATES_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Empates?retryWrites=true&w=majority&appName=Cluster0';
const APOSTAS_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Apostas?retryWrites=true&w=majority&appName=Cluster0';

// Schema flexível para ambas as bases
const TeamSchema = new mongoose.Schema({}, { strict: false });

async function migrateToApostasDB() {
  console.log('🚀 MIGRAÇÃO PARA BASE "APOSTAS"');
  console.log('═'.repeat(50));
  
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
    
    // Definir modelos para ambas as bases
    const sourceModels = {
      laliga_2024_25: empatesConnection.model('LaLiga2024', TeamSchema, 'laliga_2024_25'),
      ligue1_2024_25: empatesConnection.model('Ligue1_2024', TeamSchema, 'ligue1_2024_25'),
      premierleague_2024_25: empatesConnection.model('Premier2024', TeamSchema, 'premierleague_2024_25')
    };
    
    const targetModels = {
      laliga_2024_25: apostasConnection.model('LaLiga2024', TeamSchema, 'laliga_2024_25'),
      ligue1_2024_25: apostasConnection.model('Ligue1_2024', TeamSchema, 'ligue1_2024_25'),
      premierleague_2024_25: apostasConnection.model('Premier2024', TeamSchema, 'premierleague_2024_25')
    };
    
    const ligas = ['laliga_2024_25', 'ligue1_2024_25', 'premierleague_2024_25'];
    
    for (const liga of ligas) {
      console.log(`\n🏆 PROCESSANDO: ${liga.toUpperCase()}`);
      console.log('─'.repeat(40));
      
      // Buscar todas as equipas da liga
      const equipasOriginais = await sourceModels[liga].find({});
      console.log(`📊 Encontradas ${equipasOriginais.length} equipas`);
      
      if (equipasOriginais.length === 0) {
        console.log('⚠️  Nenhuma equipa encontrada, pulando...');
        continue;
      }
      
      // Verificar se já existe na base destino
      const equipasExistentes = await targetModels[liga].countDocuments();
      if (equipasExistentes > 0) {
        console.log(`⚠️  ${equipasExistentes} equipas já existem na base Apostas`);
        console.log('🔄 Limpando colecção existente...');
        await targetModels[liga].deleteMany({});
      }
      
      let totalJogosMigrados = 0;
      let totalJogosComOdds = 0;
      
      // Processar cada equipa
      for (const equipa of equipasOriginais) {
        console.log(`   🔄 ${equipa.teamName}: ${equipa.games?.length || 0} jogos`);
        
        // Clonar dados da equipa
        const equipaComOdds = {
          teamName: equipa.teamName,
          league: equipa.league,
          createdAt: equipa.createdAt,
          updatedAt: equipa.updatedAt,
          lastUpdated: equipa.lastUpdated,
          games: []
        };
        
        // Processar jogos e adicionar drawOdds
        if (equipa.games && Array.isArray(equipa.games)) {
          for (const jogo of equipa.games) {
            // Calcular odds inteligentes baseadas no contexto do jogo
            // Por padrão, não atribuir uma odd para jogos agendados/futuros (usar null)
            let drawOdds = null;

            // Determinar se o jogo tem uma data futura/está agendado
            const jogoDate = jogo.date ? new Date(jogo.date) : null;
            const now = new Date();
            const isFuture = jogoDate && !isNaN(jogoDate.getTime()) && jogoDate > now;

            // Se jogo tem resultado (temos homeScore e awayScore), podemos calcular uma odd
            if (jogo.homeScore !== undefined && jogo.awayScore !== undefined) {
              const isEmpate = jogo.homeScore === jogo.awayScore;
              const isFavoriteTeam = ['Barcelona', 'Real Madrid', 'Atl. Madrid', 'PSG', 'Man City', 'Arsenal', 'Bayern'].includes(jogo.homeTeam) || 
                                     ['Barcelona', 'Real Madrid', 'Atl. Madrid', 'PSG', 'Man City', 'Arsenal', 'Bayern'].includes(jogo.awayTeam);

              if (isEmpate) {
                drawOdds = 3.4; // Odds ligeiramente mais altas para empates realizados
              } else if (isFavoriteTeam) {
                drawOdds = 2.8; // Odds mais baixas em jogos com favoritos
              } else {
                drawOdds = 3.1; // Odds padrão para jogos normais
              }

              totalJogosComOdds++;
            } else {
              // Jogo sem resultado: se for futuro/agendado, manter drawOdds = null
              // Caso contrário (data passada sem resultado), atribuir uma odd baseada nas equipas
              if (jogo.status === 'scheduled' || isFuture) {
                drawOdds = null; // Sem odd definida para jogos futuros
              } else {
                const strongTeams = ['Barcelona', 'Real Madrid', 'Bayern', 'PSG', 'Man City'];
                const isStrongGame = strongTeams.includes(equipa.teamName) || strongTeams.includes(jogo.opponent);
                drawOdds = isStrongGame ? 2.9 : 3.2;
                totalJogosComOdds++;
              }
            }

            // Criar jogo com drawOdds (pode ser null)
            const jogoComOdds = {
              ...jogo.toObject ? jogo.toObject() : jogo,
              drawOdds: drawOdds
            };
            
            equipaComOdds.games.push(jogoComOdds);
            totalJogosMigrados++;
          }
        }
        
        // Salvar equipa na nova base
        await targetModels[liga].create(equipaComOdds);
      }
      
      console.log(`✅ ${liga}: ${equipasOriginais.length} equipas, ${totalJogosMigrados} jogos migrados`);
      console.log(`🎯 Jogos com odds definidas: ${totalJogosComOdds}`);
    }
    
    // Verificar resultado final
    console.log('\n📊 VERIFICAÇÃO FINAL:');
    console.log('═'.repeat(30));
    
    for (const liga of ligas) {
      const count = await targetModels[liga].countDocuments();
      
      if (count > 0) {
        // Exemplo de jogo com odds
        const exemplo = await targetModels[liga].findOne({ 'games.0': { $exists: true } });
        const primeiroJogo = exemplo?.games?.[0];
        
        console.log(`✅ ${liga}: ${count} equipas`);
        if (primeiroJogo) {
          console.log(`   📝 Exemplo: ${primeiroJogo.homeTeam} vs ${primeiroJogo.awayTeam}`);
          console.log(`   🎯 DrawOdds: ${primeiroJogo.drawOdds}`);
          console.log(`   📅 Data: ${new Date(primeiroJogo.date).toLocaleDateString('pt-PT')}`);
        }
      }
    }
    
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('📍 Base: Apostas');
    console.log('🎯 Estrutura: Mantida + drawOdds em cada jogo');
    console.log('🛡️  Protegida contra sobrescrita do SportRadar');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Fechar conexões
    await mongoose.disconnect();
    console.log('🔌 Conexões fechadas');
  }
}

migrateToApostasDB();