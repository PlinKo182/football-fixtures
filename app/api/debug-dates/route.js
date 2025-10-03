import { NextResponse } from 'next/server';
import { getAllGames } from '@/lib/dataLoader';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Verificando processamento de datas...');
    
    const allGames = await getAllGames();
    const now = new Date();
    const fourteenDaysLater = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));

    console.log(`📅 Agora: ${now.toISOString()}`);
    console.log(`📅 14 dias depois: ${fourteenDaysLater.toISOString()}`);

    const betisData = [];

    // Encontrar dados do Bétis
    Object.entries(allGames).forEach(([leagueName, teams]) => {
      teams.forEach(team => {
        if (team.teamName === 'Bétis') {
          console.log(`🎯 Encontrado Bétis em ${leagueName}`);
          
          team.games.forEach((game, index) => {
            const gameDate = new Date(game.date);
            const isAfterNow = gameDate > now;
            const isBeforeFourteenDays = gameDate < fourteenDaysLater;
            const shouldInclude = isAfterNow && isBeforeFourteenDays;
            
            betisData.push({
              index,
              opponent: game.opponent,
              location: game.location,
              rawDate: game.date,
              parsedDate: gameDate.toISOString(),
              isAfterNow,
              isBeforeFourteenDays,
              shouldInclude,
              nowComparison: `${gameDate.getTime()} vs ${now.getTime()}`,
              fourteenDaysComparison: `${gameDate.getTime()} vs ${fourteenDaysLater.getTime()}`
            });
            
            console.log(`   Jogo ${index}: ${game.opponent}`);
            console.log(`     Raw Date: ${game.date}`);
            console.log(`     Parsed Date: ${gameDate.toISOString()}`);
            console.log(`     After Now: ${isAfterNow}`);
            console.log(`     Before 14 days: ${isBeforeFourteenDays}`);
            console.log(`     Should Include: ${shouldInclude}`);
            console.log('');
          });
        }
      });
    });

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      fourteenDaysLater: fourteenDaysLater.toISOString(),
      betisData
    });
    
  } catch (error) {
    console.error('❌ Erro no debug de datas:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}