import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Game from '@/models/Game';
import axios from 'axios';
import { TEAMS, LEAGUE_MAPPINGS } from '@/lib/teams';

const SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY;
const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/soccer-extended/trial/v4/pt';

async function fetchFixturesFromSportRadar(leagueId) {
  if (!SPORTRADAR_API_KEY) {
    throw new Error('SPORTRADAR_API_KEY não configurada');
  }

  try {
    const response = await axios.get(
      `${SPORTRADAR_BASE_URL}/seasons/${leagueId}/fixtures.json?api_key=${SPORTRADAR_API_KEY}`,
      { timeout: 10000 }
    );
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar fixtures do SportRadar:', error.message);
    throw error;
  }
}

function isTeamRelevant(homeTeam, awayTeam) {
  return TEAMS.some(team => 
    homeTeam.toLowerCase().includes(team.toLowerCase()) ||
    awayTeam.toLowerCase().includes(team.toLowerCase())
  );
}

function parseFixture(fixture, leagueName) {
  const homeTeam = fixture.home_team?.name || fixture.homeTeam;
  const awayTeam = fixture.away_team?.name || fixture.awayTeam;
  
  // Só processa jogos que envolvem times relevantes
  if (!isTeamRelevant(homeTeam, awayTeam)) {
    return null;
  }

  return {
    league: leagueName,
    homeTeam,
    awayTeam,
    date: new Date(fixture.scheduled),
    time: new Date(fixture.scheduled).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    status: fixture.status === 'closed' ? 'finished' : 
            fixture.status === 'live' ? 'live' : 'scheduled',
    homeScore: fixture.home_score || null,
    awayScore: fixture.away_score || null,
    sportRadarId: fixture.id
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    
    let totalUpdated = 0;
    let totalErrors = 0;

    // Processa cada liga
    for (const [leagueName, leagueData] of Object.entries(LEAGUE_MAPPINGS)) {
      try {
        console.log(`Buscando fixtures para ${leagueName}...`);
        
        const data = await fetchFixturesFromSportRadar(leagueData.sportRadarId);
        
        if (data.fixtures && Array.isArray(data.fixtures)) {
          for (const fixture of data.fixtures) {
            const gameData = parseFixture(fixture, leagueName);
            
            if (gameData) {
              try {
                await Game.findOneAndUpdate(
                  { 
                    homeTeam: gameData.homeTeam, 
                    awayTeam: gameData.awayTeam, 
                    date: gameData.date 
                  },
                  gameData,
                  { upsert: true, new: true }
                );
                totalUpdated++;
              } catch (error) {
                if (error.code !== 11000) { // Ignora erros de duplicação
                  console.error('Erro ao salvar jogo:', error);
                  totalErrors++;
                }
              }
            }
          }
        }
        
        // Aguarda 1 segundo entre requests para respeitar rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Erro ao processar ${leagueName}:`, error.message);
        totalErrors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixtures atualizadas com sucesso!`,
      stats: {
        totalUpdated,
        totalErrors,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro geral na atualização:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET(); // Permite tanto GET quanto POST
}