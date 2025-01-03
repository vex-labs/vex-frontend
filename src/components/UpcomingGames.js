import React, { useEffect, useState } from 'react';
import GameCard from './GameCard';
import { useNear } from "@/app/context/NearContext";

/**
 * UpcomingGames component
 * 
 * This component displays a list of upcoming game matches fetched from the smartcontract.
 * It combines match data with additional match data, filters future matches, and sorts them by match time.
 * 
 * @param {Object} props - The component props
 * @param {Array} props.matches - Array of match objects
 * @param {Array} props.additionalMatchData - Array of additional match data objects
 * @param {string} props.vexAccountId - User's VEX account ID
 * 
 * @returns {JSX.Element} The rendered UpcomingGames component which consists of multiple GameCard components
 */

const UpcomingGames = ({ matches, additionalMatchData, vexAccountId }) => {
  const nearContext = useNear(); // Always call useNear at the top
  const wallet = nearContext?.wallet || null;
  const [sortedMatches, setSortedMatches] = useState([]);

  useEffect(() => {
    console.log("vexAccountId in UpcomingGames:", vexAccountId);
  }, [vexAccountId]);

  useEffect(() => {
    // Combine matches and additional data based on sanitized match_id
    const combinedMatches = matches.map(match => {
      const sanitizedMatchId = match.match_id.replace(/\s+/g, '-');
      const additionalData = additionalMatchData.find(additionalMatch =>
        additionalMatch.match_id === sanitizedMatchId
      );

      return {
        ...match,
        ...additionalData
      };
    });

    // Filter only future matches and sort them by match_time
    const futureMatches = combinedMatches
      .filter(match => match.match_state === 'Future' && match.match_time)
      .sort((a, b) => a.match_time - b.match_time);

    setSortedMatches(futureMatches);
  }, [matches, additionalMatchData]);

  return (
    <div>
      <div className="upcoming-grid-container">
        {sortedMatches.map((match, index) => {
          const sanitizedMatchId = match.match_id.replace(/\s+/g, '-');
          const additionalData = additionalMatchData.find(
            additionalMatch => additionalMatch.match_id === sanitizedMatchId
          );

          const roundedOdds1 = parseFloat(match.team_1_odds || "1.00").toFixed(2);
          const roundedOdds2 = parseFloat(match.team_2_odds || "1.00").toFixed(2);

          return (
            <GameCard
              key={match.match_id || index}
              className="upcoming-card upcoming-card-4-col"
              tournamentIcon={
                additionalData
                  ? additionalData.tournament_icon
                  : "/icons/events/vct_amer.png"
              }
              tournamentName={
                additionalData
                  ? additionalData.tournament_name
                  : match.game || "Unknown Tournament"
              }
              matchTime={
                additionalData
                  ? `${new Date(additionalData.match_time * 1000).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long'
                    })} ${new Date(additionalData.match_time * 1000).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}`
                  : "Monday, 01:00"
              }
              team1Logo={
                additionalData
                  ? additionalData.team_1_icon
                  : "/icons/teams/sen.png"
              }
              team1Name={match.team_1 || "Team 1"}
              team2Logo={
                additionalData
                  ? additionalData.team_2_icon
                  : "/icons/teams/g2.png"
              }
              team2Name={match.team_2 || "Team 2"}
              odds1={roundedOdds1}
              odds2={roundedOdds2}
              matchId={match.match_id}
              wallet={wallet}
              vexAccountId={vexAccountId}
            />
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingGames;
