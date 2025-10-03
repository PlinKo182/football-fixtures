import connectToDatabase from '../../../lib/mongodb.js';
import { getLeagueModelCurrent } from '../../../models/Team.js';
import { LEAGUE_MAPPINGS } from '../../../lib/teams.js';

// Função de parsing corrigida com logging detalhado
function parseMatchForTeamFixed(match, teamName, leagueName) {
  const homeTeam = match.teams?.home?.name;
  const awayTeam = match.teams?.away?.name;
  
  if (!homeTeam || !awayTeam) {
    return null;
  }

  // Verificar matching flexível
  const isHome = homeTeam === teamName || 
                 (teamName === 'Bétis' && homeTeam?.includes('Bétis')) ||
                 (teamName === 'Atl. Bilbao' && (homeTeam?.includes('Athletic') || homeTeam?.includes('Bilbao'))) ||
                 (teamName === 'Osasuna' && homeTeam?.includes('Osasuna'));
                 
  const isAway = awayTeam === teamName || 
                 (teamName === 'Bétis' && awayTeam?.includes('Bétis')) ||
                 (teamName === 'Atl. Bilbao' && (awayTeam?.includes('Athletic') || awayTeam?.includes('Bilbao'))) ||
                 (teamName === 'Osasuna' && awayTeam?.includes('Osasuna'));
  
  if (!isHome && !isAway) {
    return null;
  }

  // Parse da data/hora
  let fixtureDate;
  if (match.time?.uts) {
    fixtureDate = new Date(match.time.uts * 1000);
  } else if (match.time?.date && match.time?.time) {
    const dateStr = `${match.time.date} ${match.time.time}`;
    fixtureDate = new Date(dateStr + ' GMT+0100');
  } else {
    fixtureDate = new Date();
  }
  
  // CORREÇÃO CRÍTICA: Verificar a estrutura real do result
  // A partir dos dados que mostras, parece que os resultados estão em match.result.home/away
  let teamScore = null;
  let opponentScore = null;
  
  if (match.result) {
    if (isHome) {
      teamScore = match.result.home;
      opponentScore = match.result.away;
    } else {
      teamScore = match.result.away;
      opponentScore = match.result.home;
    }
  }
  
  // Log detalhado para debug
  console.log(`🎮 Processando ${teamName} vs ${isHome ? awayTeam : homeTeam}:`);
  console.log(`   - isHome: ${isHome}`);
  console.log(`   - match.result:`, match.result);
  console.log(`   - teamScore: ${teamScore}`);
  console.log(`   - opponentScore: ${opponentScore}`);
  
  const opponent = isHome ? awayTeam : homeTeam;
  
  const status = match.status === 'ended' ? 'finished' : 
                 match.status === 'live' ? 'live' : 
                 match.postponed || match.canceled || match.status === 'Adiado' ? 'postponed' : 'scheduled';
  
  const parsed = {
    opponent,
    isHome,
    date: fixtureDate,
    status,
    teamScore,
    opponentScore,
    sportRadarId: match._id?.toString()
  };
  
  console.log(`   - Resultado final:`, parsed);
  
  return parsed;
}

export async function GET() {
  try {
    console.log('🔄 REIMPORTAÇÃO CORRIGIDA com logging detalhado...');
    
    await connectToDatabase();
    
    // Limpar dados atuais
    const LaLigaModel = getLeagueModelCurrent('La Liga');
    await LaLigaModel.deleteMany({});
    console.log('🗑️  Dados da La Liga limpos');
    
    // Buscar dados da SportsRadar
    const laLigaEndpoint = LEAGUE_MAPPINGS['La Liga'].endpoint;
    const url = `https://stats.fn.sportradar.com/betano/pt/Europe:London/gismo/${laLigaEndpoint}`;
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Referer': 'https://www.betano.pt/',
      'Origin': 'https://www.betano.pt'
    };

    const response = await fetch(url, { headers });
    const data = await response.json();
    
    if (!data.doc?.[0]?.data?.matches) {
      return Response.json({ success: false, message: 'Sem dados de jogos' });
    }
    
    const matches = data.doc[0].data.matches;
    console.log(`📊 ${matches.length} jogos encontrados na SportsRadar`);
    
    // Processar cada equipa da La Liga
    const laLigaTeams = ['Bétis', 'Atl. Bilbao', 'Osasuna'];
    const results = {};
    
    for (const teamName of laLigaTeams) {
      console.log(`\n🏟️  PROCESSANDO ${teamName}:`);
      
      const teamGames = [];
      
      for (const match of matches) {
        const gameData = parseMatchForTeamFixed(match, teamName, 'La Liga');
        if (gameData) {
          teamGames.push(gameData);
        }
      }
      
      console.log(`📊 ${teamName}: ${teamGames.length} jogos processados`);
      
      if (teamGames.length > 0) {
        // Salvar no MongoDB
        await LaLigaModel.findOneAndUpdate(
          { teamName },
          { 
            teamName,
            league: 'La Liga',
            games: teamGames,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
        
        console.log(`✅ ${teamName}: ${teamGames.length} jogos salvos no MongoDB`);
        
        // Log dos primeiros jogos para verificação
        teamGames.slice(0, 2).forEach((game, index) => {
          console.log(`   ${index + 1}. vs ${game.opponent}: ${game.teamScore}-${game.opponentScore} (${game.status})`);
        });
      }
      
      results[teamName] = {
        gamesProcessed: teamGames.length,
        gamesWithResults: teamGames.filter(g => g.teamScore !== null && g.opponentScore !== null).length
      };
    }
    
    console.log('\n🎉 REIMPORTAÇÃO CONCLUÍDA!');
    
    return Response.json({
      success: true,
      message: 'Reimportação corrigida concluída',
      results: results,
      totalMatches: matches.length
    });

  } catch (error) {
    console.error('❌ Erro na reimportação corrigida:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}