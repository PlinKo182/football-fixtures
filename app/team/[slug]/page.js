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

export async function generateStaticParams() {
  return TEAMS.map((team) => ({
    slug: encodeURIComponent(team),
  }));
}

export default async function TeamPage({ params }) {
  const teamName = decodeURIComponent(params.slug);
  
  // Verifica se o time existe na lista
  if (!TEAMS.includes(teamName)) {
    notFound();
  }

  const games = await getTeamGames(teamName);
  const upcomingGames = games.filter(game => new Date(game.date) >= new Date());
  const pastGames = games.filter(game => new Date(game.date) < new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{teamName}</h1>
              <p className="text-gray-600 mt-2">
                Jogos e resultados
              </p>
            </div>
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ← Voltar
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Upcoming Games */}
        {upcomingGames.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Próximos Jogos</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingGames.map((game) => (
                <GameCard key={game._id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Past Games */}
        {pastGames.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Jogos Anteriores</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastGames.map((game) => (
                <GameCard key={game._id} game={game} isRecent />
              ))}
            </div>
          </section>
        )}

        {/* No Games Message */}
        {games.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Nenhum jogo encontrado para {teamName}.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Execute a atualização das fixtures para carregar os dados.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}