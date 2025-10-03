import Link from 'next/link';


export default function GameCard({ game, isRecent = false, highlightTeam = null, isCompact = false }) {
  const gameDate = new Date(game.date);
  const now = new Date();
  const msDiff = gameDate - now;
  const isNext24h =
    game.status === 'scheduled' &&
    msDiff > 0 &&
    msDiff <= 24 * 60 * 60 * 1000;

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
        <div className="relative px-4 py-2 flex items-center text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
        {/* Data e Hora numa só coluna */}
    <div className="w-24 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              {formattedDate}
              {game.season === '2024-25' && (
                <span className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-1 rounded text-[10px] font-semibold">
                  24/25
                </span>
              )}
            </div>
            <div className="relative text-xs text-gray-600 dark:text-gray-400 text-center">
              <div>{formattedTime}</div>
              {isNext24h && (
                <span title="Jogo nas próximas 24 horas" className="absolute left-full ml-2 top-1/2 -translate-y-1/2 ff-badge ff-24h">
                  24h
                </span>
              )}
            </div>
          </div>
        
        {/* Equipa Casa */}
        <div className="flex-1 text-right pr-2 font-medium text-gray-900 dark:text-white text-sm">
          {game.homeTeam.split(' ').map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ')}
        </div>
        
        {/* VS ou Resultado */}
        <div className="w-12 text-center">
          {(game.homeScore !== null && game.awayScore !== null) ? (
            <span className="text-sm text-gray-800 dark:text-gray-100 font-medium">{game.homeScore}-{game.awayScore}</span>
          ) : (
            <span className="text-gray-400 text-xs">vs</span>
          )}
        </div>
        
        {/* Equipa Fora */}
        <div className="flex-1 text-left pl-2 font-medium text-gray-900 dark:text-white text-sm">
          {game.awayTeam.split(' ').map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ')}
        </div>
        
  {/* Status */}
        <div className="w-16 text-center">
          {game.status === 'postponed' ? (
            <span className="text-xs font-semibold text-yellow-600">ADI</span>
          ) : (game.homeScore !== null && game.awayScore !== null) || game.status === 'finished' ? (
            <span className="text-xs font-semibold text-green-700">FIM</span>
          ) : game.status === 'live' ? (
            <span className="text-xs font-semibold text-red-600">LIVE</span>
          ) : new Date(game.date) < new Date() ? (
            <span className="text-xs font-semibold text-gray-500">???</span>
          ) : (
            <span className="text-xs font-semibold text-blue-700">AGD</span>
          )}
        </div>
      </div>
    );
  }

  return (
  <div className={`transition-all duration-200 overflow-hidden game-row ${isNext24h ? 'shadow-lg' : ''}`}>


      {/* Linha única com toda a informação */}
  <div className="px-4 py-3 flex items-center justify-between relative">

        
        {/* Equipa de Interesse - minimalista e professional */}
        <div className="w-32 text-left">
          {highlightTeam && (
            <Link
              href={`/team/${encodeURIComponent(highlightTeam)}`}
              className="inline-block text-[12px] font-semibold tracking-wide text-muted hover:text-accent transition-colors"
              style={{ letterSpacing: '0.04em', textTransform: 'none' }}
            >
              {highlightTeam}
            </Link>
          )}
        </div>

        {/* Data */}
        <div className="w-20 flex items-center justify-center md:ml-12 ml-4">
          <span className="ui-meta">{formattedDate}</span>
        </div>
        {/* Hora */}
        <div className="w-14 relative flex items-center justify-center">
          <span className="ui-meta">{formattedTime}</span>
          {isNext24h && (
            <span title="Jogo nas próximas 24 horas" className="absolute left-full ml-2 top-1/2 -translate-y-1/2 ff-badge ff-24h">
              24h
            </span>
          )}
        </div>

        {/* Equipa Casa */}
        <div className="flex-1 text-right pr-4">
          <span className="ui-title">{game.homeTeam.split(' ').map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ')}</span>
        </div>

        {/* Resultado ou VS */}
        <div className="w-16 text-center">
          {isRecent && game.homeScore !== null && game.awayScore !== null ? (
            <div className="text-lg font-semibold ui-title">
              {game.homeScore} - {game.awayScore}
            </div>
          ) : (
            <div className="text-sm ui-meta">vs</div>
          )}
        </div>

        {/* Equipa Fora */}
        <div className="flex-1 text-left pl-4">
          <span className="ui-title">{game.awayTeam.split(' ').map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ')}</span>
        </div>

        {/* Status */}
        <div className="w-16 text-right">
          <span className={`ff-badge ${
            game.status === 'live' 
              ? 'ff-status-live' :
            game.status === 'finished' || (isRecent && game.homeScore !== null && game.awayScore !== null)
              ? 'ff-status-finished' :
            game.status === 'postponed' || (new Date(game.date) < new Date() && (game.homeScore === null || game.awayScore === null))
              ? 'ff-status-postponed' :
              'ff-status-scheduled'
          }`}>
            {game.status === 'live' ? 'LIVE' :
            game.status === 'finished' || (isRecent && game.homeScore !== null && game.awayScore !== null) ? 'FIM' : 
            game.status === 'postponed' || (new Date(game.date) < new Date() && (game.homeScore === null || game.awayScore === null)) ? 'ADI' :
            'AGD'}
          </span>
        </div>

      </div>
    </div>
  );
}