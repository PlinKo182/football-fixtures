export const TEAMS = [
  // La Liga
  'Osasuna',
  'Bétis',
  'Atl. Bilbao',
  
  // Ligue 1
  'Nantes',
  'Nice',
  'Toulouse',
  'Mónaco',
  'Lille',
  'Brest',
  
  // Premier League
  'Brighton',
  'West Ham',
  'Everton',
  'Aston Villa',
  'Wolverhampton'
];

export const LEAGUE_MAPPINGS = {
  'La Liga': {
    name: 'La Liga',
    endpoint: 'stats_season_fixtures2/130805',
    teams: ['Osasuna', 'Bétis', 'Atl. Bilbao']
  },
  'Ligue 1': {
    name: 'Ligue 1',
    endpoint: 'stats_season_fixtures2/131609',
    teams: ['Nantes', 'Nice', 'Toulouse', 'Mónaco', 'Lille', 'Brest']
  },
  'Premier League': {
    name: 'Premier League',
    endpoint: 'stats_season_fixtures2/130281',
    teams: ['Brighton', 'West Ham', 'Everton', 'Aston Villa', 'Wolverhampton']
  }
};

export const getTeamsByLeague = (league) => {
  return LEAGUE_MAPPINGS[league]?.teams || [];
};

export const getLeagueByTeam = (team) => {
  for (const [leagueName, leagueData] of Object.entries(LEAGUE_MAPPINGS)) {
    if (leagueData.teams.includes(team)) {
      return leagueName;
    }
  }
  return null;
};