export const TEAMS = [
  // La Liga
  'Real Madrid',
  'Barcelona',
  'Atlético',
  'Atl. Bilbao',
  'Real Sociedad',
  
  // Ligue 1
  'Paris Saint-Germain',
  'Marseille',
  'Monaco',
  'Lyon',
  'Lille',
  
  // Premier League
  'Arsenal',
  'Manchester City',
  'Liverpool',
  'Chelsea'
];

export const LEAGUE_MAPPINGS = {
  'La Liga': {
    name: 'La Liga',
    endpoint: 'stats_season_fixtures2/130805',
    teams: ['Real Madrid', 'Barcelona', 'Atlético', 'Atl. Bilbao', 'Real Sociedad']
  },
  'Ligue 1': {
    name: 'Ligue 1',
    endpoint: 'stats_season_fixtures2/131609',
    teams: ['Paris Saint-Germain', 'Marseille', 'Monaco', 'Lyon', 'Lille']
  },
  'Premier League': {
    name: 'Premier League',
    endpoint: 'stats_season_fixtures2/130281',
    teams: ['Arsenal', 'Manchester City', 'Liverpool', 'Chelsea']
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