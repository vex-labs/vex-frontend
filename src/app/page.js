"use client";

import { useEffect, useState, useCallback } from "react";
import { useNear } from "@/app/context/NearContext";
import Sidebar from "@/components/Sidebar";
import FeaturedGames from "@/components/FeaturedGames";
import UpcomingGames from "@/components/UpcomingGames";
import { FilterX } from "lucide-react";

/**
 * Enhanced HomePage component
 *
 * This component serves as the main page for displaying featured and upcoming games.
 * Data fetching is delegated to the FeaturedGames and UpcomingGames components.
 *
 * @param {Object} props - The component props
 * @param {boolean} props.isVexLogin - Indicates if the user is logged in with VEX
 * @param {Object} props.vexKeyPair - The VEX key pair for the user
 *
 * @returns {JSX.Element} The rendered HomePage component
 */
export default function HomePage({ isVexLogin, vexKeyPair }) {
  const nearContext = useNear();
  const [selectedGame, setSelectedGame] = useState(null);
  const [vexAccountId, setVexAccountId] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const wallet = isVexLogin ? null : nearContext?.wallet || null;
  const signedAccountId = isVexLogin
    ? null
    : nearContext?.signedAccountId || null;

  // Get vexAccountId from localStorage
  useEffect(() => {
    const storedVexAccountId = localStorage.getItem("vexAccountId");
    setVexAccountId(storedVexAccountId);

    // Set initial loading to false after a short delay to allow components to render
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Handles the selection of a game from the sidebar
   */
  const handleGameSelection = useCallback((game) => {
    setSelectedGame(game);
    // Save the selected game to sessionStorage to persist across page refreshes
    sessionStorage.setItem("selectedGame", game);
  }, []);

  /**
   * Resets the game selection filter
   */
  const resetGameSelection = useCallback(() => {
    setSelectedGame(null);
    sessionStorage.removeItem("selectedGame");
  }, []);

  // Restore previously selected game from sessionStorage
  useEffect(() => {
    const savedGame = sessionStorage.getItem("selectedGame");
    if (savedGame) {
      setSelectedGame(savedGame);
    }
  }, []);

  // Method for child components to update available games
  const updateAvailableGames = useCallback((games) => {
    setAvailableGames(games);
  }, []);

  return (
    <div className="container">
      <Sidebar
        onSelectGame={handleGameSelection}
        selectedGame={selectedGame}
        availableGames={availableGames}
      />

      <div className="mainContent">
        {/* Hero Banner */}
        <div className="hero-section">
          <div className="hero-background">
            <img
              src="/icons/newBannerHD.svg"
              alt="Hero Banner"
              className="hero-banner"
            />
          </div>
        </div>

        <div className="content-wrapper">
          {/* Featured Games Section */}
          <section className="featured-section">
            <FeaturedGames
              selectedGame={selectedGame}
              wallet={wallet}
              vexAccountId={vexAccountId}
              onUpdateAvailableGames={updateAvailableGames}
            />
          </section>

          {/* Upcoming Games Section */}
          <section className="upcoming-section">
            <div className="section-header">
              <h1>Upcoming Games</h1>
              {selectedGame && (
                <button
                  onClick={resetGameSelection}
                  className="filter-button"
                  aria-label="Remove filters"
                >
                  <FilterX size={16} />
                  <span>Remove Filter: {selectedGame}</span>
                </button>
              )}
            </div>

            <UpcomingGames
              selectedGame={selectedGame}
              wallet={wallet}
              vexAccountId={vexAccountId}
              isLoading={isInitialLoading}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
