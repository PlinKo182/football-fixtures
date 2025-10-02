import connectToDatabase from '@/lib/mongodb';
import Game from '@/models/Game';
import { TEAMS } from '@/lib/teams';
import Link from 'next/link';
import GameCard from './components/GameCard';
import AutoDataLoader from './components/AutoDataLoader';

async function checkAndLoadData() {
  try {
    await connectToDatabase();
    const gameCount = await Game.countDocuments();
    return { hasData: gameCount > 0, gameCount };
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
    return { hasData: false, gameCount: 0 };
  }
}

async function getUpcomingGames() {
  try {
    await connectToDatabase();
    const upcomingGames = await Game.find({
      date: { '': new Date() },
      status: { '': ['scheduled', 'live'] }
    })
    .sort({ date: 1 })
    .limit(10)
    .lean();

    return upcomingGames.map(game => ({
      ...game,
      _id: game._id.toString(),
      date: game.date.toISOString(),
    }));
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    return [];
  }
}

export default async function Home() {
  const dataStatus = await checkAndLoadData();
  const upcomingGames = await getUpcomingGames();

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
        {!dataStatus.hasData && (
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
              <p className="text-gray-600">{!dataStatus.hasData ? 'Carregando dados...' : 'Nenhum jogo agendado encontrado.'}</p>
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-6 right-6">
        <a href="/api/update-fixtures" target="_blank" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-colors">Atualizar Fixtures</a>
      </div>
    </div>
  );
}
