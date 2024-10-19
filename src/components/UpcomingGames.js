import React, { useEffect } from 'react';
import GameCard from './GameCard';
import { useNear } from '@/app/context/NearContext';

const UpcomingGames = ({ matches, additionalMatchData }) => {
  const { wallet } = useNear();

  useEffect(() => {
    // Combine matches and additional data based on the sanitized match_id
    const combinedMatches = matches.map(match => {
      // Sanitize the match_id for matching with the database
      const sanitizedMatchId = match.match_id.replace(/\s+/g, '-');

      // Find the corresponding additional data
      const additionalData = additionalMatchData.find(additionalMatch => 
        additionalMatch.match_id === sanitizedMatchId
      );

      // Return a combined object with both match and additional data
      return {
        ...match,  // Original match data
        ...additionalData  // Spread additional data, will override match keys if any overlap
      };
    });
  }, [matches, additionalMatchData]);

  return (
    <div>
      <h1 style={{ color: 'white' }}>Upcoming Games</h1>
      <div className='upcoming-grid-container'>
        {matches.map((match, index) => {
          // Sanitize the match_id for matching
          const sanitizedMatchId = match.match_id.replace(/\s+/g, '-');

          // Find the corresponding additional data
          const additionalData = additionalMatchData.find(additionalMatch => 
            additionalMatch.match_id === sanitizedMatchId
          );

          return (
            <GameCard
              key={match.match_id || index}  // Bet ID
              className='upcoming-card upcoming-card-4-col' // predefined

              // Use additional data or fallback to placeholder if not available
              tournamentIcon={additionalData ? additionalData.tournament_icon : "/icons/events/vct_amer.png"}  
              tournamentName={additionalData ? additionalData.tournament_name : match.game || "Unknown Tournament"}  
              matchTime={additionalData ? new Date(additionalData.match_time * 1000).toLocaleString() : "Monday, 01:00"}  

              team1Logo={additionalData ? additionalData.team_1_icon : "/icons/teams/sen.png"}  
              team1Name={match.team_1 || "Team 1"}  
              team2Logo={additionalData ? additionalData.team_2_icon : "/icons/teams/g2.png"}  
              team2Name={match.team_2 || "Team 2"}  

              odds1={match.team_1_odds || "1.00"}  
              odds2={match.team_2_odds || "1.00"}  

              matchId={match.match_id}  // Pass the original match_id to GameCard
              wallet={wallet} // wallet object
            />
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingGames;
