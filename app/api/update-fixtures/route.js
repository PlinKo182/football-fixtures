import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getLeagueModel } from '@/models/Team';
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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
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

function parseMatchForTeam(match, teamName, leagueName) {
  const homeTeam = match.teams?.home?.name;
  const awayTeam = match.teams?.away?.name;
  
  if (!homeTeam || !awayTeam) {
    return null;
  }

  // Verificar se o jogo envolve a equipa especificada
  const isHome = homeTeam === teamName;
  const isAway = awayTeam === teamName;
  
  if (!isHome && !isAway) {
    return null;
  }

  // Parse da data/hora - usar o campo time.uts (Unix timestamp)
  let fixtureDate;
  if (match.time?.uts) {
    fixtureDate = new Date(match.time.uts * 1000);
  } else if (match.time?.date && match.time?.time) {
    const dateStr = `${match.time.date} ${match.time.time}`;
    fixtureDate = new Date(dateStr);
  } else {
    fixtureDate = new Date();
  }
  
  // Determinar o adversário e os resultados
  const opponent = isHome ? awayTeam : homeTeam;
  const teamScore = isHome ? match.result?.home : match.result?.away;
  const opponentScore = isHome ? match.result?.away : match.result?.home;
  
  return {
    opponent,
    isHome,
    date: fixtureDate,
    time: fixtureDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    status: match.status === 'ended' ? 'finished' : 
            match.status === 'live' ? 'live' : 'scheduled',
    teamScore,
    opponentScore,
    sportRadarId: match._id?.toString()
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
        
        if (data && data.doc && data.doc[0] && data.doc[0].data && data.doc[0].data.matches) {
          const matches = data.doc[0].data.matches;
          console.log(`Encontradas ${matches.length} matches para ${leagueName}`);
          
          const LeagueModel = getLeagueModel(leagueName);
          const relevantTeams = leagueData.teams;
          
          // Processar cada equipa relevante
          for (const teamName of relevantTeams) {
            try {
              const teamGames = [];
              
              // Encontrar todos os jogos desta equipa
              for (const match of matches) {
                const gameData = parseMatchForTeam(match, teamName, leagueName);
                if (gameData) {
                  teamGames.push(gameData);
                }
              }
              
              if (teamGames.length > 0) {
                // Atualizar ou criar o documento da equipa
                await LeagueModel.findOneAndUpdate(
                  { teamName },
                  { 
                    teamName,
                    league: leagueName,
                    games: teamGames,
                    lastUpdated: new Date()
                  },
                  { upsert: true, new: true }
                );
                
                console.log(`✅ ${teamName}: ${teamGames.length} jogos`);
                totalUpdated += teamGames.length;
              }
            } catch (error) {
              console.error(`Erro ao salvar dados de ${teamName}:`, error);
              totalErrors++;
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