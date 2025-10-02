export default function GameCard({ game, isRecent = false }) {
  const gameDate = new Date(game.date);
  const formattedDate = gameDate.toLocaleDateString('pt-BR');
  const formattedTime = game.time;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {game.league}
        </span>
        <span className={`text-xs px-2 py-1 rounded ${
          game.status === 'live' ? 'bg-red-100 text-red-800' :
          game.status === 'finished' ? 'bg-gray-100 text-gray-800' :
          'bg-green-100 text-green-800'
        }`}>
          {game.status === 'live' ? 'AO VIVO' :
           game.status === 'finished' ? 'FINALIZADO' : 'AGENDADO'}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{game.homeTeam}</div>
          <div className="text-gray-600">vs</div>
          <div className="font-semibold text-gray-900">{game.awayTeam}</div>
        </div>
        
        {isRecent && game.homeScore !== null && game.awayScore !== null ? (
          <div className="text-2xl font-bold text-gray-900">
            {game.homeScore} - {game.awayScore}
          </div>
        ) : (
          <div className="text-right text-sm text-gray-600">
            <div>{formattedDate}</div>
            <div>{formattedTime}</div>
          </div>
        )}
      </div>
    </div>
  );
}