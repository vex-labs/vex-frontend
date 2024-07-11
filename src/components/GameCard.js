import React from 'react';

const GameCard = ({ className, tournamentIcon, tournamentName, matchTime, team1Logo, team1Name, team2Logo, team2Name, odds1, odds2 }) => {
  return (
    <div className={`${className}`}>
      <div className="match-header">
        <div className="match-info">
          <img src={tournamentIcon} alt="Tournament" className="tournament-icon" />
          <span>{tournamentName}</span>
        </div>
        <div className="match-time">
          <span>{matchTime}</span>
        </div>
      </div>
      <div className="match-body">
        <div className="team">
          <img src={team1Logo} alt={team1Name} className="team-logo" />
          <span className="team-name">{team1Name}</span>
        </div>
        <div className="vs">
          <span>VS</span>
        </div>
        <div className="team">
          <img src={team2Logo} alt={team2Name} className="team-logo" />
          <span className="team-name">{team2Name}</span>
        </div>
      </div>
      <div className="match-odds">
        <div className="odds">
          <span>{team1Name} Win </span>
          <span className="odds-value">{odds1}</span>
        </div>
        <div className="odds">
          <span>{team2Name} Win</span>
          <span className="odds-value">{odds2}</span>
        </div>
      </div>
    </div>
  );
}

export default GameCard;
