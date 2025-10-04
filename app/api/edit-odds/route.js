import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// URL da base Apostas
const APOSTAS_URI = process.env.MONGODB_URI.replace('/Empates', '/Apostas');

// Schema flexível
const TeamSchema = new mongoose.Schema({}, { strict: false });

export async function PUT(req) {
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

    console.log('✏️ EDITANDO ODD EXISTENTE');
    console.log(`Jogo: ${homeTeam} vs ${awayTeam}`);
    console.log(`Nova odd: ${drawOdds}`);

    // Conectar à base Apostas
    const apostasConnection = mongoose.createConnection(APOSTAS_URI);
    await apostasConnection.asPromise();

    // Detectar liga
    let liga = 'La Liga';
    const ligues = ['PSG', 'Monaco', 'Lille', 'Brest', 'Toulouse'];
    const premier = ['Arsenal', 'Man City', 'Aston Villa', 'West Ham', 'Wolverhampton', 'Everton'];
    
    if (ligues.includes(homeTeam) || ligues.includes(awayTeam)) {
      liga = 'Ligue 1';
    } else if (premier.includes(homeTeam) || premier.includes(awayTeam)) {
      liga = 'Premier League';
    }

    const ligaKey = liga === 'La Liga' ? 'laliga_2025_26' : 
                   liga === 'Ligue 1' ? 'ligue1_2025_26' : 'premierleague_2025_26';
    
    const apostasModel = apostasConnection.model('ApostasTeam', TeamSchema, ligaKey);

    // Encontrar e atualizar o jogo em AMBAS as equipas
    const equipas = [homeTeam, awayTeam];
    let jogosAtualizados = 0;

    for (const nomeEquipa of equipas) {
      const equipa = await apostasModel.findOne({ teamName: nomeEquipa });
      
      if (equipa && equipa.games) {
        // Encontrar o jogo específico
        const jogoIndex = equipa.games.findIndex(g => 
          g.homeTeam === homeTeam && g.awayTeam === awayTeam &&
          new Date(g.date).toDateString() === new Date(date).toDateString()
        );

        if (jogoIndex !== -1) {
          // Atualizar drawOdds
          equipa.games[jogoIndex].drawOdds = drawOdds;
          equipa.updatedAt = new Date();
          
          await equipa.save();
          jogosAtualizados++;
          
          console.log(`✅ Odd atualizada para equipa: ${nomeEquipa}`);
        }
      }
    }

    await apostasConnection.close();

    if (jogosAtualizados === 0) {
      return NextResponse.json({ 
        error: 'Jogo não encontrado na base Apostas. Use /api/set-odds primeiro.' 
      }, { status: 404 });
    }

    console.log(`🎉 Odd editada com sucesso em ${jogosAtualizados} equipa(s)!`);

    return NextResponse.json({
      success: true,
      message: `Odd atualizada com sucesso`,
      game: {
        homeTeam,
        awayTeam,
        date,
        drawOdds,
        league: liga
      },
      updatedTeams: jogosAtualizados
    });

  } catch (error) {
    console.error('❌ Erro ao editar odd:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}