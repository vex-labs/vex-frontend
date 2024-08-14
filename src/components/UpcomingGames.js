import React from 'react';
import GameCard from './GameCard';
import { useNear } from '@/app/context/NearContext';

const UpcomingGames = ({ matches }) => {
    const { wallet } = useNear();
  return (
    <div>
      <h1 style={{ color: 'white' }}>Upcoming Games</h1>
      <div className='upcoming-grid-container'>
        {matches.map((match, index) => (
          <GameCard
            key={match.match_id || index}  // Bet ID
            className='upcoming-card upcoming-card-4-col' // predefined
            tournamentIcon="/icons/events/vct_amer.png"  // Placeholder 
            tournamentName={match.game || "Unknown Tournament"}  // game name 
            matchTime="Monday, 01:00"  // Placeholder 
            team1Logo="/icons/teams/sen.png"  // Placeholder 
            team1Name={match.team_1 || "Team 1"}  
            team2Logo="/icons/teams/g2.png"  // Placeholder value
            team2Name={match.team_2 || "Team 2"}  
            odds1={match.team_1_odds || "1.00"}  
            odds2={match.team_2_odds || "1.00"}  
            matchId={match.match_id}  // match_id 
            wallet={wallet} // wallet object
          />
        ))}
      </div>
    </div>
  );
};

export default UpcomingGames;