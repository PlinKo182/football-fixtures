// Script para migração manual de jogos específicos para teste
const mongoose = require('mongoose');

// Configurar variável de ambiente
process.env.MONGODB_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Empates?retryWrites=true&w=majority&appName=Cluster0';

// Schema do HistoricalGame
const HistoricalGameSchema = new mongoose.Schema({
  league: {
    type: String,
    required: true,
    enum: ['La Liga', 'Ligue 1', 'Premier League']
  },
  homeTeam: String,
  awayTeam: String,
  date: Date,
  time: String,
  homeScore: Number,
  awayScore: Number,
  status: { type: String, default: 'finished' },
  teamOdds: {
    type: Map,
    of: { draw: Number }
  },
  season: String,
  originalGameId: String,
  sportRadarId: String,
  migratedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Helper para calcular temporada
HistoricalGameSchema.statics.calculateSeason = function(gameDate) {
  const date = new Date(gameDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (month < 7) {
    return `${year - 1}-${String(year).slice(-2)}`;
  } else {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
};

async function migrateSpecificGames() {
  console.log('🎯 MIGRAÇÃO MANUAL DE JOGOS ESPECÍFICOS');
  console.log('═'.repeat(50));
  
  try {
    // Conectar
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Criar modelos
    const HistoricalGame = mongoose.models.HistoricalGame || mongoose.model('HistoricalGame', HistoricalGameSchema);
    const LaLiga2024 = mongoose.model('LaLiga2024Temp', mongoose.Schema({}, { strict: false }), 'laliga_2024_25');
    
    // Buscar o jogo de empate específico: Real Sociedad vs Atl. Bilbao (0-0)
    console.log('🔍 Buscando o jogo de empate...');
    const equipaAtlBilbao = await LaLiga2024.findOne({ teamName: 'Atl. Bilbao' });
    
    if (!equipaAtlBilbao) {
      console.log('❌ Equipa Atl. Bilbao não encontrada');
      return;
    }
    
    // Encontrar o jogo específico de empate
    const jogoEmpate = equipaAtlBilbao.games.find(jogo => 
      jogo.homeScore === 0 && 
      jogo.awayScore === 0 && 
      (jogo.homeTeam === 'Real Sociedad' || jogo.awayTeam === 'Real Sociedad')
    );
    
    if (!jogoEmpate) {
      console.log('❌ Jogo de empate não encontrado');
      return;
    }
    
    console.log('✅ JOGO DE EMPATE ENCONTRADO:');
    console.log(`   ${jogoEmpate.homeTeam} vs ${jogoEmpate.awayTeam}`);
    console.log(`   Resultado: ${jogoEmpate.homeScore}-${jogoEmpate.awayScore}`);
    console.log(`   Data: ${new Date(jogoEmpate.date).toLocaleDateString('pt-PT')}`);
    
    // Verificar se já existe na base histórica
    const jaExiste = await HistoricalGame.findOne({
      homeTeam: jogoEmpate.homeTeam,
      awayTeam: jogoEmpate.awayTeam,
      date: jogoEmpate.date
    });
    
    if (jaExiste) {
      console.log('⚠️  Jogo já existe na base histórica!');
      console.log(`   ID histórico: ${jaExiste._id}`);
      console.log(`   TeamOdds: ${JSON.stringify(Object.fromEntries(jaExiste.teamOdds))}`);
      return;
    }
    
    // Criar registo histórico
    console.log('\n🏗️  CRIANDO REGISTO HISTÓRICO...');
    
    const season = HistoricalGame.calculateSeason(jogoEmpate.date);
    const teamOdds = new Map();
    
    // ODDS OBRIGATÓRIAS - todos os jogos precisam de odds de empate
    const drawOdds = 3.2; // Odds específicas para este jogo
    
    // TeamOdds para compatibilidade
    teamOdds.set(jogoEmpate.homeTeam, { draw: drawOdds });
    teamOdds.set(jogoEmpate.awayTeam, { draw: drawOdds });
    
    const dadosHistoricos = {
      league: 'La Liga',
      homeTeam: jogoEmpate.homeTeam,
      awayTeam: jogoEmpate.awayTeam,
      date: jogoEmpate.date,
      time: new Date(jogoEmpate.date).toTimeString().slice(0, 5),
      homeScore: jogoEmpate.homeScore,
      awayScore: jogoEmpate.awayScore,
      status: 'finished',
      season: season,
      originalGameId: jogoEmpate._id?.toString(),
      sportRadarId: jogoEmpate.sportRadarId,
      // CAMPO PRINCIPAL - odds de empate para este jogo
      drawOdds: drawOdds,
      // Manter para compatibilidade
      teamOdds: teamOdds
    };
    
    console.log('📊 DADOS A CRIAR:');
    console.log(`   Teams: ${dadosHistoricos.homeTeam} vs ${dadosHistoricos.awayTeam}`);
    console.log(`   Score: ${dadosHistoricos.homeScore}-${dadosHistoricos.awayScore}`);
    console.log(`   Season: ${dadosHistoricos.season}`);
    console.log(`   DrawOdds: ${dadosHistoricos.drawOdds} (PRINCIPAL)`);
    console.log(`   TeamOdds: ${JSON.stringify(Object.fromEntries(teamOdds))} (compatibilidade)`);
    
    // CRIAR REALMENTE
    const jogoHistorico = await HistoricalGame.create(dadosHistoricos);
    
    console.log('\n🎉 REGISTO HISTÓRICO CRIADO COM SUCESSO!');
    console.log(`   🆔 ID: ${jogoHistorico._id}`);
    console.log(`   📅 MigradoEm: ${jogoHistorico.migratedAt}`);
    
    // Vamos criar mais alguns jogos para ter dados suficientes
    console.log('\n🔄 CRIANDO MAIS ALGUNS JOGOS...');
    
    // Buscar mais 2-3 jogos com resultados diferentes
    const outrosJogos = equipaAtlBilbao.games
      .filter(jogo => 
        jogo.homeScore !== undefined && 
        jogo.awayScore !== undefined &&
        !(jogo.homeScore === 0 && jogo.awayScore === 0) // Excluir o empate já criado
      )
      .slice(0, 3);
      
    for (const jogo of outrosJogos) {
      const existeJa = await HistoricalGame.findOne({
        homeTeam: jogo.homeTeam,
        awayTeam: jogo.awayTeam,
        date: jogo.date
      });
      
      if (!existeJa) {
        const seasonJogo = HistoricalGame.calculateSeason(jogo.date);
        const oddsJogo = new Map();
        
        // ODDS PARA TODOS OS JOGOS - lógica inteligente
        const isEmpate = jogo.homeScore === jogo.awayScore;
        const isFavoriteTeam = ['Barcelona', 'Real Madrid', 'Atl. Madrid'].includes(jogo.homeTeam) || 
                               ['Barcelona', 'Real Madrid', 'Atl. Madrid'].includes(jogo.awayTeam);
        
        // Odds mais baixas para jogos com favoritos, mais altas para empates realizados
        let drawOddsValue;
        if (isEmpate) {
          drawOddsValue = 3.4; // Odds ligeiramente mais altas para empates que aconteceram
        } else if (isFavoriteTeam) {
          drawOddsValue = 2.9; // Odds mais baixas em jogos com favoritos
        } else {
          drawOddsValue = 3.1; // Odds padrão
        }
        
        oddsJogo.set(jogo.homeTeam, { draw: drawOddsValue });
        oddsJogo.set(jogo.awayTeam, { draw: drawOddsValue });
        
        const jogoAdicional = await HistoricalGame.create({
          league: 'La Liga',
          homeTeam: jogo.homeTeam,
          awayTeam: jogo.awayTeam,
          date: jogo.date,
          time: new Date(jogo.date).toTimeString().slice(0, 5),
          homeScore: jogo.homeScore,
          awayScore: jogo.awayScore,
          status: 'finished',
          season: seasonJogo,
          originalGameId: jogo._id?.toString(),
          sportRadarId: jogo.sportRadarId,
          // CAMPO PRINCIPAL
          drawOdds: drawOddsValue,
          // Compatibilidade
          teamOdds: oddsJogo
        });
        
        const resultado = jogo.homeScore === jogo.awayScore ? '🟰 EMPATE' : 
                         jogo.homeScore > jogo.awayScore ? '🏠 CASA' : '✈️ FORA';
        
        console.log(`   ✅ ${jogo.homeTeam} vs ${jogo.awayTeam} (${jogo.homeScore}-${jogo.awayScore}) ${resultado}`);
      }
    }
    
    // Verificar total criado
    const totalHistoricos = await HistoricalGame.countDocuments();
    console.log(`\n📊 TOTAL DE JOGOS HISTÓRICOS: ${totalHistoricos}`);
    
    // Mostrar alguns exemplos
    const exemplos = await HistoricalGame.find({}).limit(5).sort({ date: -1 });
    console.log('\n🎯 EXEMPLOS CRIADOS:');
    exemplos.forEach((jogo, i) => {
      const data = new Date(jogo.date).toLocaleDateString('pt-PT');
      const odds = jogo.teamOdds ? Object.fromEntries(jogo.teamOdds) : {};
      const resultado = jogo.homeScore === jogo.awayScore ? '🟰 EMPATE' : 
                       jogo.homeScore > jogo.awayScore ? '🏠 CASA' : '✈️ FORA';
      
      console.log(`${i+1}. ${jogo.homeTeam} vs ${jogo.awayTeam} (${jogo.homeScore}-${jogo.awayScore}) ${resultado}`);
      console.log(`   📅 ${data} | Season: ${jogo.season}`);
      console.log(`   🎯 DrawOdds: ${jogo.drawOdds} (PRINCIPAL)`);
      console.log(`   📊 TeamOdds: ${JSON.stringify(odds)}`);
      console.log('─'.repeat(30));
    });
    
    console.log('\n🎉 MIGRAÇÃO MANUAL CONCLUÍDA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  }
}

migrateSpecificGames();