import Link from 'next/link';

export default function GameCard({ game, isRecent = false, highlightTeam = null, isCompact = false }) {
  const gameDate = new Date(game.date);
  
  // Formato manual para garantir "05 out 25"
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                  'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const day = gameDate.getDate().toString().padStart(2, '0');
  const month = months[gameDate.getMonth()];
  const year = gameDate.getFullYear().toString().slice(-2);
  const formattedDate = `${day} ${month} ${year}`;
  
  // Converter para hora portuguesa em formato 24h
  const formattedTime = gameDate.toLocaleTimeString('pt-PT', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Lisbon'
  });

  // Se for modo compacto, usar layout diferente
  if (isCompact) {
    return (
      <div className="px-4 py-2 flex items-center text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
        {/* Data e Hora numa só coluna */}
        <div className="w-24 text-xs text-gray-600 dark:text-gray-400">
          <div>{formattedDate}</div>
          <div className="font-mono">{formattedTime}</div>
        </div>
        
        {/* Equipa Casa */}
        <div className="flex-1 text-right pr-2 font-medium text-gray-900 dark:text-white">
          {game.homeTeam}
        </div>
        
        {/* VS ou Resultado */}
        <div className="w-12 text-center">
          {isRecent && (game.homeScore !== null && game.awayScore !== null) ? (
            <span className="text-xs font-mono bg-gray-100 dark:bg-slate-600 px-1 py-0.5 rounded">
              {game.homeScore}-{game.awayScore}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">vs</span>
          )}
        </div>
        
        {/* Equipa Fora */}
        <div className="flex-1 text-left pl-2 font-medium text-gray-900 dark:text-white">
          {game.awayTeam}
        </div>
        
        {/* Status */}
        <div className="w-16 text-center">
          {game.status === 'postponed' ? (
            <span className="w-8 h-5 bg-yellow-500 text-white text-xs font-bold rounded-sm flex items-center justify-center">ADI</span>
          ) : game.status === 'finished' ? (
            <span className="w-8 h-5 bg-green-500 text-white text-xs font-bold rounded-sm flex items-center justify-center">FIM</span>
          ) : game.status === 'live' ? (
            <span className="w-8 h-5 bg-red-500 text-white text-xs font-bold rounded-sm flex items-center justify-center">LIVE</span>
          ) : (
            <span className="w-8 h-5 bg-blue-500 text-white text-xs font-bold rounded-sm flex items-center justify-center">AGD</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200 rounded-lg overflow-hidden hover:shadow-sm">
      {/* Linha única com toda a informação */}
      <div className="px-6 py-4 flex items-center justify-between">
        
        {/* Equipa de Interesse */}
        <div className="flex-shrink-0 w-28 text-center">
          {highlightTeam && (
            <Link 
              href={`/team/${encodeURIComponent(highlightTeam)}`}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1 rounded-md transition-colors inline-block"
            >
              {highlightTeam}
            </Link>
          )}
        </div>

        {/* Data e Hora */}
        <div className="flex-shrink-0 w-28 text-center ml-4">
          <div className="text-sm font-medium text-gray-900 dark:text-white">{formattedDate}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{formattedTime}</div>
        </div>

        {/* Equipa Casa */}
        <div className="flex-1 text-right pr-4">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{game.homeTeam}</span>
        </div>

        {/* Resultado ou VS */}
        <div className="flex-shrink-0 w-16 text-center">
          {isRecent && game.homeScore !== null && game.awayScore !== null ? (
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {game.homeScore} - {game.awayScore}
            </div>
          ) : (
            <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">vs</div>
          )}
        </div>

        {/* Equipa Fora */}
        <div className="flex-1 text-left pl-4">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{game.awayTeam}</span>
        </div>

        {/* Status */}
        <div className="flex-shrink-0 w-16 text-right">
          <span className={`text-xs font-medium px-2 py-1 rounded-md ${
            game.status === 'live' 
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
            game.status === 'finished' 
              ? 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300' :
            game.status === 'postponed' 
              ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
              'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          }`}>
            {game.status === 'live' ? 'LIVE' :
             game.status === 'finished' ? 'FIM' : 
             game.status === 'postponed' ? 'ADI' : 'AGD'}
          </span>
        </div>

      </div>
    </div>
  );
}