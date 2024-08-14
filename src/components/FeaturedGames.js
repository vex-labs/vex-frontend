import React from 'react';
import GameCard from './GameCard';

const FeaturedGames = () => {
    return (
        <div> <h1 style={{ color: 'white' }}>Featured Games</h1>
        <div className='featured-grid-container'>
        <GameCard
           className= 'featured-card featured-card-3-col'
           tournamentIcon="/icons/events/vct_china.png"
           tournamentName="VCT 24: China"
           matchTime="Today, 19:00"
           team1Logo="/icons/teams/edg.png"
           team1Name="EDG"
           team2Logo="/icons/teams/fpx.png"
           team2Name="FPX"
           odds1="1.87"
           odds2="1.87"
           />
        <GameCard
           className= 'featured-card featured-card-3-col'
           tournamentIcon="/icons/events/vct_china.png"
           tournamentName="VCT 24: China"
           matchTime="Today, 19:00"
           team1Logo="/icons/teams/edg.png"
           team1Name="EDG"
           team2Logo="/icons/teams/fpx.png"
           team2Name="FPX"
           odds1="1.87"
           odds2="1.87"
           />

        <GameCard
           className= 'featured-card featured-card-3-col'
           tournamentIcon="/icons/events/vct_china.png"
           tournamentName="VCT 24: China"
           matchTime="Today, 19:00"
           team1Logo="/icons/teams/edg.png"
           team1Name="EDG"
           team2Logo="/icons/teams/fpx.png"
           team2Name="FPX"
           odds1="1.87"
           odds2="1.87"
           />

        <GameCard
           className= 'featured-card featured-card-3-col'
           tournamentIcon="/icons/events/vct_china.png"
           tournamentName="VCT 24: China"
           matchTime="Today, 19:00"
           team1Logo="/icons/teams/edg.png"
           team1Name="EDG"
           team2Logo="/icons/teams/fpx.png"
           team2Name="FPX"
           odds1="1.87"
           odds2="1.87"
           />
        </div>
        </div>
    )
}

export default FeaturedGames;