import React from "react";
import "./MobileGameSelector.css";
import { games } from "@/data/games";

const MobileGameSelector = ({ onSelectGame, selectedGame }) => {
  return (
    <div className="mobile-game-main-container">
      <h1>Games</h1>
      <div className="mobile-game-selector">
        <div className="mobile-game-selector-container">
          {games.map((game) => (
            <button
              key={game.name}
              className={`mobile-game ${
                selectedGame === game.name ? "active" : ""
              }`}
              onClick={() => onSelectGame(game.name)}
            >
              <img src={game.icon} alt={game.label} />
              <span>{game.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileGameSelector;
