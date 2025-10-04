"use client";

import BettingAnalysis from './BettingAnalysis';

export default function TeamBettingAnalysis({ teamName, games }) {
  return (
    <BettingAnalysis
      teamName={teamName}
      games={games}
      // Team view: show full history, keep team column out by default
      showEmptyGamesTable={false}
      showTeamColumn={false}
      showTeamColumnLeft={false}
      showTimeColumn={false}
      hideResultColumn={false}
      forceFutureGames={false}
    />
  );
}
