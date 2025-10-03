import { getAllGames } from '@/lib/dataLoader';
import { TEAMS } from '@/lib/teams';
import Link from 'next/link';
import GameCard from './components/GameCard';
import AutoDataLoader from './components/AutoDataLoader';

async function getUpcomingGames() {
  try {
    const allGames = await getAllGames();
    const upcomingGames = [];
    const now = new Date();

    // Iterar por todas as ligas e equipas
    Object.entries(allGames).forEach(([leagueName, teams]) => {
      teams.forEach(team => {
        team.games.forEach(game => {
          const gameDate = new Date(game.date);
          const fourteenDaysLater = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
          
          if (gameDate > now && gameDate < fourteenDaysLater) {
            upcomingGames.push({
              _id: `${team.teamName}-${game.sportRadarId || Math.random()}`,
              league: team.league || leagueName,
              homeTeam: game.isHome ? team.teamName : game.opponent,
              awayTeam: game.isHome ? game.opponent : team.teamName,
              date: game.date,
              time: game.time || 'TBD',
              status: game.status || 'scheduled',
              homeScore: game.isHome ? game.teamScore : game.opponentScore,
              awayScore: game.isHome ? game.opponentScore : game.teamScore
            });
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
    console.error('Erro ao buscar jogos próximos:', error);
    return [];
  }
}

export default async function Home() {
  const upcomingGames = await getUpcomingGames();
  const hasData = upcomingGames.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AutoDataLoader />
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Football Fixtures</h1>
          <p className="text-gray-600 mt-2">Acompanhe os jogos dos seus times favoritos</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!hasData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h3 className="text-sm font-medium text-yellow-800">Base de dados vazia</h3>
            <p className="mt-1 text-sm text-yellow-700">O sistema irá carregar automaticamente os dados da API SportRadar</p>
          </div>
        )}

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Times</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {TEAMS.map((team) => (
              <Link key={team} href={'/team/' + encodeURIComponent(team)} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center">
                <h3 className="font-semibold text-gray-900 text-sm">{team}</h3>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Próximos Jogos</h2>
          {upcomingGames.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingGames.map((game) => (
                <GameCard key={game._id} game={game} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">{!hasData ? 'Carregando dados...' : 'Nenhum jogo agendado encontrado.'}</p>
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <a href="/api/update-fixtures" target="_blank" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-colors">Atualizar Fixtures</a>
        <a href="/api/force-update" target="_blank" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-colors text-sm">Forçar Atualização</a>
      </div>
    </div>
  );
}
