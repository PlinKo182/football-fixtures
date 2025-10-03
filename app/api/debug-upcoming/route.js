import { NextResponse } from 'next/server';
import { getAllGames } from '@/lib/dataLoader';
import { TEAMS } from '@/lib/teams';

// Função para determinar qual equipa é de interesse (das nossas equipas)
function getTeamOfInterest(homeTeam, awayTeam) {
  if (TEAMS.includes(homeTeam)) return homeTeam;
  if (TEAMS.includes(awayTeam)) return awayTeam;
  return null;
}

export async function GET() {
  try {
    console.log('🔍 DEBUG: Testando função getUpcomingGames em produção...');
    
    const allGames = await getAllGames();
    
    const upcomingGames = [];
    const addedGames = new Set();
    const now = new Date();
    const fourteenDaysLater = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));

    const debugInfo = {
      currentTime: now.toISOString(),
      fourteenDaysLater: fourteenDaysLater.toISOString(),
      teamsOfInterest: TEAMS,
      leagueSummary: {},
      detailedGames: []
    };

    // Iterar por todas as ligas e equipas
    Object.entries(allGames).forEach(([leagueName, teams]) => {
      debugInfo.leagueSummary[leagueName] = {
        totalTeams: teams.length,
        teamNames: teams.map(t => t.teamName),
        gamesFound: 0
      };
      
      teams.forEach(team => {
        team.games.forEach(game => {
          const gameDate = new Date(game.date);
          
          if (gameDate > now && gameDate < fourteenDaysLater) {
            const uniqueId = `${leagueName}_${team.teamName}_${game.date}`;
            if (!addedGames.has(uniqueId)) {
              addedGames.add(uniqueId);
              const homeTeam = game.location === 'home' ? team.teamName : game.opponent;
              const awayTeam = game.location === 'home' ? game.opponent : team.teamName;
              
              const gameObj = {
                id: uniqueId,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                league: leagueName,
                date: game.date,
                time: game.time,
                status: 'scheduled',
                teamOfInterest: getTeamOfInterest(homeTeam, awayTeam)
              };
              
              upcomingGames.push(gameObj);
              debugInfo.leagueSummary[leagueName].gamesFound++;
              
              // Adicionar jogos detalhados para debug
              debugInfo.detailedGames.push({
                league: leagueName,
                team: team.teamName,
                homeTeam,
                awayTeam,
                date: game.date,
                gameDate: gameDate.toISOString(),
                isAfterNow: gameDate > now,
                isBeforeFourteenDays: gameDate < fourteenDaysLater,
                teamOfInterest: getTeamOfInterest(homeTeam, awayTeam)
              });
            }
          }
        });
      });
    });

    // Remover duplicatas
    const uniqueGames = upcomingGames.filter((game, index, self) => 
      index === self.findIndex(g => 
        g.homeTeam === game.homeTeam && 
        g.awayTeam === game.awayTeam && 
        new Date(g.date).getTime() === new Date(game.date).getTime()
      )
    );
    
    const finalGames = uniqueGames
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10)
      .map(game => ({
        ...game,
        date: new Date(game.date).toISOString(),
      }));

    return NextResponse.json({
      success: true,
      debugInfo,
      stats: {
        totalGamesAdded: upcomingGames.length,
        uniqueGames: uniqueGames.length,
        finalGames: finalGames.length
      },
      finalGames
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}