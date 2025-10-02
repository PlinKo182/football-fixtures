import { TEAMS } from '@/lib/teams';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Football Fixtures</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe os jogos dos seus times favoritos
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Times</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {TEAMS.map((team) => (
              <Link
                key={team}
                href={'/team/' + encodeURIComponent(team)}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
              >
                <h3 className="font-semibold text-gray-900 text-sm">{team}</h3>
              </Link>
            ))}
          </div>
        </section>

        <section className="text-center py-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-blue-800 mb-4">
              Configure as variáveis de ambiente e clique em Atualizar Fixtures para carregar os dados.
            </p>
            <a
              href="/api/update-fixtures"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Atualizar Fixtures
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
