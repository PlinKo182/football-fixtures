import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// URLs das bases de dados
const EMPATES_URI = process.env.MONGODB_URI; // Base atual
const APOSTAS_URI = process.env.MONGODB_URI.replace('/Empates', '/Apostas'); // Nova base

// Schema flexível
const TeamSchema = new mongoose.Schema({}, { strict: false });

export async function POST(req) {
  try {
    const { homeTeam, awayTeam, date, drawOdds } = await req.json();
    
    if (!homeTeam || !awayTeam || !date || !drawOdds) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: homeTeam, awayTeam, date, drawOdds' 
      }, { status: 400 });
    }

    if (drawOdds < 1.01 || drawOdds > 50) {
      return NextResponse.json({ 
        error: 'Odds devem estar entre 1.01 e 50.0' 
      }, { status: 400 });
    }

    console.log('🎯 DEFININDO ODD - MIGRAÇÃO INSTANTÂNEA');
    console.log(`Jogo: ${homeTeam} vs ${awayTeam}`);
    console.log(`Odd: ${drawOdds}`);

    // Conectar às duas bases
    const empatesConnection = mongoose.createConnection(EMPATES_URI);
    const apostasConnection = mongoose.createConnection(APOSTAS_URI);

    await Promise.all([
      empatesConnection.asPromise(),
      apostasConnection.asPromise()
    ]);

    // Detectar liga baseada nas equipas
    let liga = 'La Liga'; // Default
    const ligues = ['PSG', 'Monaco', 'Lille', 'Brest', 'Toulouse'];
    const premier = ['Arsenal', 'Man City', 'Aston Villa', 'West Ham', 'Wolverhampton', 'Everton'];
    
    if (ligues.includes(homeTeam) || ligues.includes(awayTeam)) {
      liga = 'Ligue 1';
    } else if (premier.includes(homeTeam) || premier.includes(awayTeam)) {
      liga = 'Premier League';
    }

    // Modelos das bases
    const ligaKey = liga === 'La Liga' ? 'laliga_2025_26' : 
                   liga === 'Ligue 1' ? 'ligue1_2025_26' : 'premierleague_2025_26';
    
    const empatesModel = empatesConnection.model('EmpatesTeam', TeamSchema, ligaKey);
    
    const apostasKey = ligaKey.replace('2025_26', '2025_26'); // Manter mesma época para jogos atuais
    const apostasModel = apostasConnection.model('ApostasTeam', TeamSchema, apostasKey);

    // Buscar jogo na base Empates
    const equipaHome = await empatesModel.findOne({ teamName: homeTeam });
    const equipaAway = await empatesModel.findOne({ teamName: awayTeam });

    if (!equipaHome && !equipaAway) {
      return NextResponse.json({ 
        error: 'Jogo não encontrado na base de dados' 
      }, { status: 404 });
    }

    // Procurar o jogo específico
    let jogoOriginal = null;
    let equipaOriginal = null;

    if (equipaHome) {
      jogoOriginal = equipaHome.games?.find(g => 
        g.homeTeam === homeTeam && g.awayTeam === awayTeam &&
        new Date(g.date).toDateString() === new Date(date).toDateString()
      );
      if (jogoOriginal) equipaOriginal = equipaHome;
    }

    if (!jogoOriginal && equipaAway) {
      jogoOriginal = equipaAway.games?.find(g => 
        g.homeTeam === homeTeam && g.awayTeam === awayTeam &&
        new Date(g.date).toDateString() === new Date(date).toDateString()
      );
      if (jogoOriginal) equipaOriginal = equipaAway;
    }

    if (!jogoOriginal) {
      return NextResponse.json({ 
        error: 'Jogo específico não encontrado' 
      }, { status: 404 });
    }

    // Verificar se já existe em Apostas
    const equipaApostasHome = await apostasModel.findOne({ teamName: homeTeam });
    const jogoJaExiste = equipaApostasHome?.games?.find(g => 
      g.homeTeam === homeTeam && g.awayTeam === awayTeam &&
      new Date(g.date).toDateString() === new Date(date).toDateString()
    );

    if (jogoJaExiste) {
      return NextResponse.json({ 
        error: 'Jogo já tem odd definida. Use /api/edit-odds para editar.' 
      }, { status: 409 });
    }

    console.log('✅ Jogo encontrado, iniciando migração...');

    // Migrar AMBAS as equipas para Apostas
    const equipasParaMigrar = [homeTeam, awayTeam];
    
    for (const nomeEquipa of equipasParaMigrar) {
      const equipaEmpates = await empatesModel.findOne({ teamName: nomeEquipa });
      if (!equipaEmpates) continue;

      // Verificar se equipa já existe em Apostas
      let equipaApostas = await apostasModel.findOne({ teamName: nomeEquipa });
      
      if (!equipaApostas) {
        // Criar nova equipa em Apostas
        equipaApostas = {
          teamName: nomeEquipa,
          league: liga,
          games: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // Processar jogos desta equipa
      const jogosAtualizados = [...(equipaApostas.games || [])];
      
      for (const jogo of equipaEmpates.games || []) {
        // Verificar se já existe
        const jaExiste = jogosAtualizados.find(j => 
          j.homeTeam === jogo.homeTeam && j.awayTeam === jogo.awayTeam &&
          new Date(j.date).toDateString() === new Date(jogo.date).toDateString()
        );

        if (!jaExiste) {

            // Adicionar drawOdds apenas para o jogo específico que o usuário escolheu.
            // Não definir 3.0 como default para outros jogos para evitar sobrescrever jogos agendados.
            let oddParaJogo = null;
            if (jogo.homeTeam === homeTeam && jogo.awayTeam === awayTeam) {
              oddParaJogo = drawOdds; // Odd definida pelo usuário
            }

            const jogoComOdd = {
              ...jogo.toObject ? jogo.toObject() : jogo,
              drawOdds: oddParaJogo
            };

          jogosAtualizados.push(jogoComOdd);
        }
      }

      // Salvar/atualizar equipa em Apostas
      await apostasModel.updateOne(
        { teamName: nomeEquipa },
        {
          teamName: nomeEquipa,
          league: liga,
          games: jogosAtualizados,
          updatedAt: new Date()
        },
        { upsert: true }
      );
    }

    // Fechar conexões
    await empatesConnection.close();
    await apostasConnection.close();

    console.log('🎉 Migração concluída com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Odd definida e jogo migrado para base protegida',
      game: {
        homeTeam,
        awayTeam,
        date,
        drawOdds,
        league: liga
      }
    });

  } catch (error) {
    console.error('❌ Erro ao definir odd:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}