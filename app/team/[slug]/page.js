import { getAllGames } from '@/lib/dataLoader';
import { TEAMS, getLeagueByTeam } from '@/lib/teams';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import GameCard from '@/app/components/GameCard';

// Função para buscar jogos de um time específico
async function getTeamGames(teamName) {
  try {
    const allGames = await getAllGames();
    
    // Encontrar a liga da equipa
    let teamData = null;
    Object.values(allGames).forEach(teams => {
      const found = teams.find(team => team.teamName === teamName);
      if (found) {
        teamData = found;
      }
    });

    if (!teamData) {
      return [];
    }

    // Converter jogos para o formato esperado
    return teamData.games.map(game => ({
      _id: `${teamName}-${game.sportRadarId}`,
      league: teamData.league || 'La Liga',
      homeTeam: game.isHome ? teamName : game.opponent,
      awayTeam: game.isHome ? game.opponent : teamName,
      date: new Date(game.date).toISOString(),
      time: game.time,
      status: game.status,
      homeScore: game.isHome ? game.teamScore : game.opponentScore,
      awayScore: game.isHome ? game.opponentScore : game.teamScore
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Erro ao buscar jogos do time:', error);
    return [];
  }
}

// Remover generateStaticParams para permitir rotas dinâmicas
// export async function generateStaticParams() {
//   return TEAMS.map((team) => ({
//     slug: encodeURIComponent(team),
//   }));
// }

export default async function TeamPage({ params }) {
  const resolvedParams = await params;
  const teamName = decodeURIComponent(resolvedParams.slug);
  
  // Verifica se o time existe na lista
  if (!TEAMS.includes(teamName)) {
    notFound();
  }

  const games = await getTeamGames(teamName);
  const upcomingGames = games.filter(game => new Date(game.date) >= new Date());
  const pastGames = games.filter(game => new Date(game.date) < new Date());

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Header moderno */}
      <header className="header-gradient shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                <span className="text-white text-xl">⚽</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">{teamName}</h1>
                <p className="text-blue-100 text-lg">
                  {games.length} jogos • {upcomingGames.length} próximos
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 border border-white/30 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Próximos Jogos */}
        {upcomingGames.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mr-4">📅 Próximos Jogos</h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">{upcomingGames.length} jogos</span>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gray-50 dark:bg-slate-700 px-6 py-3 border-b border-gray-100 dark:border-slate-600">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                  <div className="w-28 text-center ml-32">Data</div>
                  <div className="flex-1 text-right pr-4">Casa</div>
                  <div className="w-16 text-center"></div>
                  <div className="flex-1 text-left pl-4">Fora</div>
                  <div className="w-24 text-center"></div>
                  <div className="w-16 text-right">Status</div>
                </div>
              </div>
              
              {/* Lista de jogos */}
              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {upcomingGames.map((game, index) => (
                  <div key={game._id} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-900'}`}>
                    <GameCard game={game} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Jogos Anteriores */}
        {pastGames.length > 0 && (
          <section>
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mr-4">📊 Jogos Anteriores</h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">{pastGames.length} jogos</span>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gray-50 dark:bg-slate-700 px-6 py-3 border-b border-gray-100 dark:border-slate-600">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                  <div className="w-28 text-center ml-32">Data</div>
                  <div className="flex-1 text-right pr-4">Casa</div>
                  <div className="w-16 text-center">Resultado</div>
                  <div className="flex-1 text-left pl-4">Fora</div>
                  <div className="w-24 text-center"></div>
                  <div className="w-16 text-right">Status</div>
                </div>
              </div>
              
              {/* Lista de jogos */}
              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {pastGames.map((game, index) => (
                  <div key={game._id} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-900'}`}>
                    <GameCard game={game} isRecent />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Mensagem quando não há jogos */}
        {games.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Nenhum jogo encontrado</h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              Não foram encontrados jogos para {teamName}.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800 inline-block px-4 py-2 rounded-lg">
              💡 Execute a atualização das fixtures para carregar os dados
            </p>
          </div>
        )}
      </main>
    </div>
  );
}