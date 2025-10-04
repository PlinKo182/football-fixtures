import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// URLs das bases de dados
const EMPATES_URI = process.env.MONGODB_URI;
const APOSTAS_URI = process.env.MONGODB_URI.replace('/Empates', '/Apostas');

// Schema flexível
const TeamSchema = new mongoose.Schema({}, { strict: false });

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teamName = searchParams.get('teamName') || searchParams.get('team');
    
    if (!teamName) {
      return NextResponse.json({ 
        error: 'Parâmetro teamName é obrigatório' 
      }, { status: 400 });
    }

    console.log(`🔍 VERIFICANDO STATUS DOS JOGOS: ${teamName}`);

    // Conectar às duas bases
    const empatesConnection = mongoose.createConnection(EMPATES_URI);
    const apostasConnection = mongoose.createConnection(APOSTAS_URI);

    await Promise.all([
      empatesConnection.asPromise(),
      apostasConnection.asPromise()
    ]);

    // Detectar liga da equipa
    let liga = 'La Liga';
    const ligues = ['PSG', 'Monaco', 'Lille', 'Brest', 'Toulouse'];
    const premier = ['Arsenal', 'Man City', 'Aston Villa', 'West Ham', 'Wolverhampton', 'Everton'];
    
    if (ligues.includes(teamName)) {
      liga = 'Ligue 1';
    } else if (premier.includes(teamName)) {
      liga = 'Premier League';
    }

    const ligaKey = liga === 'La Liga' ? 'laliga_2025_26' : 
                   liga === 'Ligue 1' ? 'ligue1_2025_26' : 'premierleague_2025_26';

    // Buscar dados em ambas as bases
    const empatesModel = empatesConnection.model('EmpatesTeam', TeamSchema, ligaKey);
    const apostasModel = apostasConnection.model('ApostasTeam', TeamSchema, ligaKey);

    const [equipaEmpates, equipaApostas] = await Promise.all([
      empatesModel.findOne({ teamName }),
      apostasModel.findOne({ teamName })
    ]);

    // Combinar jogos das duas bases
    const jogosUnificados = [];
    const jogosProcessados = new Set();

    // Primeiro, adicionar jogos da base Apostas (com odds definidas)
    if (equipaApostas && equipaApostas.games) {
      for (const jogo of equipaApostas.games) {
        const jogoKey = `${jogo.homeTeam}-${jogo.awayTeam}-${new Date(jogo.date).toDateString()}`;
        
        if (!jogosProcessados.has(jogoKey)) {
          jogosUnificados.push({
            ...jogo.toObject ? jogo.toObject() : jogo,
            source: 'apostas',
            hasCustomOdds: true,
            isEditable: true, // Pode editar na página da equipa
            canDefineOdds: false // Já tem odd definida
          });
          jogosProcessados.add(jogoKey);
        }
      }
    }

    // Depois, adicionar jogos apenas da base Empates (sem odds)
    if (equipaEmpates && equipaEmpates.games) {
      for (const jogo of equipaEmpates.games) {
        const jogoKey = `${jogo.homeTeam}-${jogo.awayTeam}-${new Date(jogo.date).toDateString()}`;
        
        if (!jogosProcessados.has(jogoKey)) {
          const isGameFinished = (jogo.homeScore !== undefined && jogo.homeScore !== null) &&
                                (jogo.awayScore !== undefined && jogo.awayScore !== null);
          
          jogosUnificados.push({
            ...jogo.toObject ? jogo.toObject() : jogo,
            source: 'empates',
            hasCustomOdds: false,
            isEditable: false, // Não pode editar se não tem odd
            canDefineOdds: !isGameFinished, // Só pode definir se não terminou
            drawOdds: null
          });
          jogosProcessados.add(jogoKey);
        }
      }
    }

    // Ordenar por data
    jogosUnificados.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Separar por status
    const jogosFuturos = jogosUnificados.filter(j => {
      const gameDate = new Date(j.date);
      const now = new Date();
      return gameDate > now;
    });

    const jogosTerminados = jogosUnificados.filter(j => {
      const isFinished = (j.homeScore !== undefined && j.homeScore !== null) &&
                        (j.awayScore !== undefined && j.awayScore !== null);
      return isFinished;
    });

    const jogosAndamento = jogosUnificados.filter(j => {
      const gameDate = new Date(j.date);
      const now = new Date();
      const isFinished = (j.homeScore !== undefined && j.homeScore !== null) &&
                        (j.awayScore !== undefined && j.awayScore !== null);
      return gameDate <= now && !isFinished;
    });

    await empatesConnection.close();
    await apostasConnection.close();

    return NextResponse.json({
      success: true,
      teamName,
      league: liga,
      summary: {
        totalGames: jogosUnificados.length,
        withCustomOdds: jogosUnificados.filter(j => j.hasCustomOdds).length,
        canDefineOdds: jogosUnificados.filter(j => j.canDefineOdds).length,
        finished: jogosTerminados.length,
        upcoming: jogosFuturos.length,
        inProgress: jogosAndamento.length
      },
      games: {
        upcoming: jogosFuturos,
        inProgress: jogosAndamento,
        finished: jogosTerminados,
        all: jogosUnificados
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}