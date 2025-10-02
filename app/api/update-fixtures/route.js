import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Game from '@/models/Game';
import axios from 'axios';
import { TEAMS, LEAGUE_MAPPINGS } from '@/lib/teams';

const BASE_URL = "https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/";
const LEAGUE_ENDPOINTS = {
  "La Liga": "stats_season_fixtures2/130805",
  "Ligue 1": "stats_season_fixtures2/131609",
  "Premier League": "stats_season_fixtures2/130281"
};

async function fetchFixturesFromAPI(leagueEndpoint) {
  try {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    const response = await axios.get(
      `${BASE_URL}${leagueEndpoint}`,
      { 
        headers,
        timeout: 15000 
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar fixtures da API:', error.message);
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
  const homeTeam = fixture.home?.name || fixture.home?.abbr || fixture.homeTeam;
  const awayTeam = fixture.away?.name || fixture.away?.abbr || fixture.awayTeam;
  
  // Só processa jogos que envolvem times relevantes
  if (!isTeamRelevant(homeTeam, awayTeam)) {
    return null;
  }

  // Parse da data/hora
  const fixtureDate = new Date(fixture.scheduled || fixture.date);
  
  return {
    league: leagueName,
    homeTeam,
    awayTeam,
    date: fixtureDate,
    time: fixtureDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    status: fixture.status === 'closed' ? 'finished' : 
            fixture.status === 'live' ? 'live' : 
            fixture.match_status === 'ended' ? 'finished' : 'scheduled',
    homeScore: fixture.home_score || fixture.score?.home || null,
    awayScore: fixture.away_score || fixture.score?.away || null,
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
        
        const data = await fetchFixturesFromAPI(leagueData.endpoint);
        
        if (data && data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.fixtures) {
          const fixtures = data.doc[0].data.fixtures;
          for (const fixture of fixtures) {
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