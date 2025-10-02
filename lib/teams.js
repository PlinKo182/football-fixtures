export const TEAMS = [
  // La Liga
  'Real Madrid',
  'Barcelona',
  'Atletico Madrid',
  'Athletic Bilbao',
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
    sportRadarId: 'sr:season:118689', // La Liga 2024/25
    teams: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Athletic Bilbao', 'Real Sociedad']
  },
  'Ligue 1': {
    name: 'Ligue 1',
    sportRadarId: 'sr:season:118699', // Ligue 1 2024/25
    teams: ['Paris Saint-Germain', 'Marseille', 'Monaco', 'Lyon', 'Lille']
  },
  'Premier League': {
    name: 'Premier League',
    sportRadarId: 'sr:season:118689', // Premier League 2024/25
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