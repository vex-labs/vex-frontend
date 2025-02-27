"use client";

import { useEffect, useState, useCallback } from "react";
import { useNear } from "@/app/context/NearContext";
import Sidebar from "@/components/Sidebar";
import FeaturedGames from "@/components/FeaturedGames";
import UpcomingGames from "@/components/UpcomingGames";
import { FilterX, Search, X } from "lucide-react";
import "./search-styles.css";
import MobileGameSelector from "@/components/MobileGameSelector";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
    // Clear search when selecting a game category
    setSearchTerm("");
  }, []);

  /**
   * Resets the game selection filter
   */
  const resetGameSelection = useCallback(() => {
    setSelectedGame(null);
    sessionStorage.removeItem("selectedGame");
  }, []);

  /**
   * Handles search input changes
   */
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  /**
   * Clears the search term
   */
  const clearSearch = useCallback(() => {
    setSearchTerm("");
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

        <div className="search-and-filter-container">
          <div
            className={`search-container ${isSearchFocused ? "focused" : ""}`}
          >
            <div className="search-icon">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search games, teams, tournaments..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="game-search-input"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label="Search games"
            />
            {searchTerm && (
              <button
                className="clear-search-button"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <MobileGameSelector
            selectedGame={selectedGame}
            onSelectGame={handleGameSelection}
          />
        </div>

        <div className="content-wrapper">
          {/* Active filters display */}
          {(selectedGame || searchTerm) && (
            <div className="active-filters">
              <div className="active-filters-heading">Active Filters:</div>
              <div className="filters-container">
                {selectedGame && (
                  <div className="filter-tag">
                    <span>Game: {selectedGame}</span>
                    <button
                      onClick={resetGameSelection}
                      aria-label="Remove game filter"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {searchTerm && (
                  <div className="filter-tag">
                    <span>Search: {searchTerm}</span>
                    <button onClick={clearSearch} aria-label="Clear search">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    resetGameSelection();
                    clearSearch();
                  }}
                  className="clear-all-filters"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Featured Games Section */}
          <section className="featured-section">
            <FeaturedGames
              selectedGame={selectedGame}
              searchTerm={searchTerm}
              wallet={wallet}
              vexAccountId={vexAccountId}
              onUpdateAvailableGames={updateAvailableGames}
            />
          </section>

          {/* Upcoming Games Section */}
          <section className="upcoming-section">
            <div className="section-header">
              <h1>Upcoming Games</h1>
            </div>

            <UpcomingGames
              selectedGame={selectedGame}
              searchTerm={searchTerm}
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
