"use client";

import BettingAnalysis from './BettingAnalysis';

export default function HomeBettingAnalysis({ games }) {
  return (
    <BettingAnalysis
      teamName={"Upcoming"}
      games={games}
      showEmptyGamesTable={true}
      showTeamColumn={true}
      showTeamColumnLeft={true}
      showTimeColumn={true}
      hideResultColumn={true}
      forceFutureGames={true}
    />
  );
}
