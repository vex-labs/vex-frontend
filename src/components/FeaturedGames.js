import React from 'react';
import GameCard from './GameCard';

/**
 * FeaturedGames component
 * 
 * This component renders a list of featured games based on specified match IDs.
 * It filters the provided matches to only include those with the specified match IDs
 * and combines them with additional match data.
 * 
 * @param {Object} props - The component props
 * @param {Array<Object>} props.matches - The list of match objects
 * @param {Array<Object>} props.additionalMatchData - The list of additional match data objects
 * 
 * @returns {JSX.Element} The rendered FeaturedGames component
 */
const FeaturedGames = ({ matches, additionalMatchData }) => {
  // Define the specific match IDs you want to display
  const featuredMatchIds = [
    "Team_Falcons-Twisted_Minds-22/11/2024", 
    "Faze-Cloud9-17/11/2024",
    "SSG-NTMR-22/11/2024",
    "Astralis-9_Pandas-21/11/2024"
  ];

  // Filter the matches to only include those with the specified match IDs
  const featuredMatches = matches
    .filter(match => featuredMatchIds.includes(match.match_id))
    .map(match => {
      // Find additional data based on match_id
      const additionalData = additionalMatchData.find(
        additional => additional.match_id === match.match_id
      );

      // Combine match and additional data
      return {
        ...match,
        ...additionalData
      };
    });

  return (
    <div>
      <h1 style={{ color: 'white' }}>Featured Games</h1>
      <div className="featured-grid-container">
        {featuredMatches.map((match, index) => (
          <GameCard
            key={match.match_id || index}
            className="featured-card featured-card-3-col"
            tournamentIcon={match.tournament_icon || "/icons/events/vct_china.png"}
            tournamentName={match.tournament_name || "Unknown Tournament"}
            matchTime={
              `${new Date(match.match_time * 1000).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long'
              })} ${new Date(match.match_time * 1000).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}`
            }
            team1Logo={match.team_1_icon || "/icons/teams/edg.png"}
            team1Name={match.team_1 || "Team 1"}
            team2Logo={match.team_2_icon || "/icons/teams/fpx.png"}
            team2Name={match.team_2 || "Team 2"}
            odds1={parseFloat(match.team_1_odds || "1.00").toFixed(2)}
            odds2={parseFloat(match.team_2_odds || "1.00").toFixed(2)}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedGames;
