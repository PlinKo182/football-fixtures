import { NextResponse } from 'next/server';
import { getAllGames } from '@/lib/dataLoader';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Verificando datas específicas do Osasuna...');
    
    const allGames = await getAllGames();
    const debugData = [];

    // Encontrar dados do Osasuna
    Object.entries(allGames).forEach(([leagueName, teams]) => {
      teams.forEach(team => {
        if (team.teamName === 'Osasuna') {
          console.log(`🎯 Encontrado Osasuna em ${leagueName}`);
          
          team.games.forEach((game, index) => {
            if (game.opponent === 'Getafe') {
              const gameDate = new Date(game.date);
              
              debugData.push({
                index,
                opponent: game.opponent,
                isHome: game.isHome,
                rawDate: game.date,
                rawDateType: typeof game.date,
                parsedDate: gameDate.toISOString(),
                localTime: gameDate.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false
                }),
                portugalTime: gameDate.toLocaleTimeString('pt-PT', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false,
                  timeZone: 'Europe/Lisbon'
                }),
                utcTime: gameDate.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false,
                  timeZone: 'UTC'
                }),
                timestamp: gameDate.getTime()
              });
              
              console.log(`   Jogo vs Getafe:`);
              console.log(`     Raw Date: ${game.date} (type: ${typeof game.date})`);
              console.log(`     Parsed Date: ${gameDate.toISOString()}`);
              console.log(`     Local Time: ${gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`);
              console.log(`     Portugal Time: ${gameDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Lisbon' })}`);
              console.log(`     UTC Time: ${gameDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}`);
            }
          });
        }
      });
    });

    return NextResponse.json({
      success: true,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currentServerTime: new Date().toISOString(),
      debugData
    });
    
  } catch (error) {
    console.error('❌ Erro no debug específico:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}