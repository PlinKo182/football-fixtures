import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAllGames } from '../lib/dataLoader.js';

const testHomepage = async () => {
  console.log('🏠 TESTE LÓGICA HOMEPAGE...\n');
  
  try {
    console.log('📊 Chamando getAllGames...');
    const allGames = await getAllGames();
    console.log('Ligas retornadas:', Object.keys(allGames));
    
    if (Object.keys(allGames).length === 0) {
      console.log('❌ getAllGames retornou vazio!');
      return;
    }
    
    const upcomingGames = [];
    const now = new Date();
    console.log(`🕐 Data atual: ${now.toISOString()}\n`);

    // Reproduzir exatamente a lógica da homepage
    Object.entries(allGames).forEach(([leagueName, teams]) => {
      console.log(`📋 Liga: ${leagueName} (${teams.length} equipas)`);
      
      teams.forEach(team => {
        console.log(`   Equipa: ${team.teamName} (${team.games.length} jogos)`);
        
        let upcomingCount = 0;
        team.games.forEach(game => {
          const gameDate = new Date(game.date);
          const fourteenDaysLater = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
          
          if (gameDate > now && gameDate < fourteenDaysLater) {
            upcomingCount++;
            
            if (upcomingCount <= 2) { // Mostrar só primeiros 2
              console.log(`      ✅ Próximo: vs ${game.opponent} em ${gameDate.toLocaleDateString('pt-PT')}`);
            }
            
            upcomingGames.push({
              _id: `${team.teamName}-${game.sportRadarId || Math.random()}`,
              league: team.league || leagueName,
              homeTeam: game.isHome ? team.teamName : game.opponent,
              awayTeam: game.isHome ? game.opponent : team.teamName,
              date: game.date,
              time: game.time || 'TBD',
              status: game.status || 'scheduled'
            });
          }
        });
        
        console.log(`      Total próximos: ${upcomingCount}`);
      });
      console.log('');
    });

    console.log(`🎯 Total jogos próximos: ${upcomingGames.length}`);
    
    // Remover duplicatas
    const uniqueGames = upcomingGames.filter((game, index, self) => 
      index === self.findIndex(g => 
        g.homeTeam === game.homeTeam && 
        g.awayTeam === game.awayTeam && 
        new Date(g.date).getTime() === new Date(game.date).getTime()
      )
    );

    console.log(`🎯 Jogos únicos: ${uniqueGames.length}`);
    
    if (uniqueGames.length === 0) {
      console.log('\n❌ PROBLEMA: Nenhum jogo próximo encontrado!');
      console.log('Possíveis causas:');
      console.log('- Todos os jogos são muito antigos ou muito futuros');
      console.log('- Problema na lógica de data');
      console.log('- Status dos jogos incorreto');
    } else {
      console.log('\n🏆 PRIMEIROS 3 JOGOS:');
      uniqueGames
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3)
        .forEach((game, i) => {
          console.log(`   ${i+1}. ${game.homeTeam} vs ${game.awayTeam}`);
          console.log(`      Data: ${new Date(game.date).toLocaleDateString('pt-PT')} ${game.time}`);
          console.log(`      Liga: ${game.league}`);
        });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  }
};

testHomepage();