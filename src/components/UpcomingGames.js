import React from 'react';
import GameCard from './GameCard';

const UpcomingGames = () => {
    return (
        <div className='upcoming-grid-container'>
            <GameCard
            className= 'upcoming-card upcoming-card-4-col'
            tournamentIcon="/icons/tournament_icon.png"
            tournamentName="VCT 24: AMER Stage 2"
            matchTime="Today, 19:00"
            team1Logo="/icons/nrg_logo.png"
            team1Name="NRG Esports"
            team2Logo="/icons/leviatan_logo.png"
            team2Name="Leviatán"
            odds1="1.87"
            odds2="1.87"
            />
            <div className="upcoming-card upcoming-card-4-col">
                <h2>Game 2</h2>
                <p>Odds data...</p>
            </div>
            <div className="upcoming-card upcoming-card-4-col">
                <h2>Game 3</h2>
                <p>Odds data...</p>
            </div>
            <div className="upcoming-card upcoming-card-4-col">
                <h2>Game 4</h2>
                <p>Odds data...</p>
            </div>
            <div className="upcoming-card upcoming-card-4-col">
                <h2>Game 5</h2>
                <p>Odds data...</p>
            </div>
            <div className="upcoming-card upcoming-card-4-col">
                <h2>Game 6</h2>
                <p>Odds data...</p>
            </div>
            
        </div>
    )
}

export default UpcomingGames;