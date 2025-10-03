import { getAllGames } from '@/lib/dataLoader';
import { TEAMS } from '@/lib/teams';
import Link from 'next/link';
import GameCard from './components/GameCard';
import AutoDataLoader from './components/AutoDataLoader';
import ImportHistoricalButton from './components/ImportHistoricalButton';

// Função para determinar qual equipa é de interesse (das nossas equipas)
function getTeamOfInterest(homeTeam, awayTeam) {
  if (TEAMS.includes(homeTeam)) return homeTeam;
  if (TEAMS.includes(awayTeam)) return awayTeam;
  return null;
}

async function getUpcomingGames() {
  try {
    const allGames = await getAllGames();
    
    const upcomingGames = [];
    const addedGames = new Set();
    const now = new Date();

    // Iterar por todas as ligas e equipas
    Object.entries(allGames).forEach(([leagueName, teams]) => {
      teams.forEach(team => {
        team.games.forEach(game => {
          const gameDate = new Date(game.date);
          const fourteenDaysLater = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
          
          if (gameDate > now && gameDate < fourteenDaysLater) {
            const uniqueId = `${leagueName}_${team.teamName}_${game.date}`;
            if (!addedGames.has(uniqueId)) {
              addedGames.add(uniqueId);
              const homeTeam = game.isHome ? team.teamName : game.opponent;
              const awayTeam = game.isHome ? game.opponent : team.teamName;
              
              upcomingGames.push({
                id: uniqueId,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                league: leagueName,
                date: game.date,
                status: 'scheduled',
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
    


    return uniqueGames
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10)
      .map(game => ({
        ...game,
        date: new Date(game.date).toISOString(),
      }));
    
  } catch (error) {
    console.error('❌ Erro ao buscar jogos próximos:', error);
    console.error(error.stack);
    return [];
  }
}

export default async function Home() {
  const upcomingGames = await getUpcomingGames();
  const hasData = upcomingGames.length > 0;

  return (
    <div className="min-h-screen dark:bg-slate-900">
      <AutoDataLoader />

      {/* Simplified minimal header */}
      <header className="mb-6">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-100">Football Fixtures</h1>
            <p className="mt-1 text-sm text-muted">Próximos jogos • Atualizado automaticamente</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="ff-card px-6 py-3 flex flex-col items-center" style={{background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6))'}}>
              <span className="text-xs text-muted">Próximos jogos</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingGames.length}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Alerta se não há dados */}
        {!hasData && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-12 shadow-sm">
            <div className="flex items-center">
              <div className="bg-amber-100 dark:bg-amber-900/50 rounded-full p-2 mr-4">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Base de dados vazia</h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">O sistema irá carregar automaticamente os dados da API SportRadar</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Botão para importar dados históricos */}
        {hasData && (
          <div className="mb-8">
            <ImportHistoricalButton />
          </div>
        )}



        {/* Secção de próximos jogos */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-100 mr-4">Próximos jogos</h2>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            {upcomingGames.length > 0 && (
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">{upcomingGames.length} jogos</span>
            )}
          </div>
          
          {upcomingGames.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
              {/* Header da "tabela" */}
              <div className="table-header px-6 py-3">
                <div className="flex items-center justify-between text-sm font-medium text-gray-400 dark:text-gray-300">
                  <div className="w-32 text-left ff-smallcaps col">Equipa</div>
                  <div className="w-20 flex items-center justify-center md:ml-12 ml-4 col">Data</div>
                  <div className="w-14 flex items-center justify-center col">Hora</div>
                  <div className="flex-1 text-right pr-4 col">Casa</div>
                  <div className="w-16 text-center col"></div>
                  <div className="flex-1 text-left pl-4 col">Fora</div>
                  <div className="w-16 text-right col">Status</div>
                </div>
              </div>
              
              {/* Lista de jogos */}
              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {upcomingGames.map((game, index) => (
                  <div key={game.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-900'}`}>
                    <GameCard game={game} highlightTeam={game.teamOfInterest} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 p-12 text-center">
              <div className="bg-gray-100 dark:bg-slate-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">{!hasData ? 'Carregando dados...' : 'Nenhum jogo agendado encontrado.'}</p>
            </div>
          )}
        </section>
      </main>

      {/* Botões flutuantes modernos */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <a 
          href="/api/update-fixtures" 
          target="_blank" 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </a>
        <a 
          href="/api/force-update" 
          target="_blank" 
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm flex items-center gap-2"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Forçar
        </a>
      </div>
    </div>
  );
}
