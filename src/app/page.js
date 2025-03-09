"use client";

import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import FeaturedGames from "@/components/FeaturedGames";
import UpcomingGames from "@/components/UpcomingGames";
import { Search, X, ArrowUpDown } from "lucide-react";
import "./search-styles.css";
import MobileGameSelector from "@/components/MobileGameSelector";
import { useTour } from "@reactour/tour";
import { useSearchParams } from "next/navigation";

/**
 * Sort options for the matches
 */
export const SORT_OPTIONS = {
  UPCOMING: "upcoming", // Closest in time (default)
  DISTANT: "distant", // Furthest in the future
  HOT: "hot", // Highest betting volume
  NEW: "new", // Most recently added
  FOR_ME: "for_me", // Personalized (to be implemented)
};

/**
 * Enhanced HomePage component
 *
 * This component serves as the main page for displaying featured and upcoming games.
 * Data fetching is delegated to the FeaturedGames and UpcomingGames components.
 *
 * @returns {JSX.Element} The rendered HomePage component
 */
export default function HomePage() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.UPCOMING); // Default to Upcoming
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const params = useSearchParams();
  const startTourParam = params.get("startTour");

  const { setIsOpen } = useTour();

  // Start the tour if the query parameter is present
  useEffect(() => {
    if (startTourParam) {
      // Start the tour
      setIsOpen(true);
    }
  }, [startTourParam, setIsOpen]);

  // Set initial loading to false after a short delay to allow components to render
  useEffect(() => {
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

  /**
   * Handles changing the sort option
   */
  const handleSortChange = useCallback((option) => {
    setSortOption(option);
    setShowSortDropdown(false);
    sessionStorage.setItem("sortOption", option);
  }, []);

  /**
   * Toggles the sort dropdown visibility
   */
  const toggleSortDropdown = useCallback(() => {
    setShowSortDropdown((prev) => !prev);
  }, []);

  /**
   * Reference for the sort dropdown
   */
  const sortDropdownRef = React.useRef(null);

  /**
   * Handle clicks outside the sort dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setShowSortDropdown(false);
      }
    };

    // Add event listener when dropdown is open
    if (showSortDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortDropdown]);

  // Restore previously selected game and sort option from sessionStorage
  useEffect(() => {
    const savedGame = sessionStorage.getItem("selectedGame");
    if (savedGame) {
      setSelectedGame(savedGame);
    }

    const savedSortOption = sessionStorage.getItem("sortOption");
    if (
      savedSortOption &&
      Object.values(SORT_OPTIONS).includes(savedSortOption)
    ) {
      setSortOption(savedSortOption);
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

          {/* Sort selector dropdown - moved to end for right alignment */}
          <div className="sort-selector-container" ref={sortDropdownRef}>
            <button
              className="sort-selector-button"
              onClick={toggleSortDropdown}
              aria-haspopup="true"
              aria-expanded={showSortDropdown}
            >
              <ArrowUpDown size={16} />
              <span>
                Sort:{" "}
                {sortOption === SORT_OPTIONS.UPCOMING
                  ? "Upcoming"
                  : sortOption === SORT_OPTIONS.DISTANT
                  ? "Distant"
                  : sortOption === SORT_OPTIONS.HOT
                  ? "Hot"
                  : sortOption === SORT_OPTIONS.NEW
                  ? "New"
                  : sortOption === SORT_OPTIONS.FOR_ME
                  ? "For Me"
                  : "Sort"}
              </span>
            </button>

            {showSortDropdown && (
              <div className="sort-dropdown">
                <button
                  className={`sort-option ${
                    sortOption === SORT_OPTIONS.UPCOMING ? "active" : ""
                  }`}
                  onClick={() => handleSortChange(SORT_OPTIONS.UPCOMING)}
                >
                  Upcoming (Soonest)
                </button>
                <button
                  className={`sort-option ${
                    sortOption === SORT_OPTIONS.DISTANT ? "active" : ""
                  }`}
                  onClick={() => handleSortChange(SORT_OPTIONS.DISTANT)}
                >
                  Distant (Furthest)
                </button>
                <button
                  className={`sort-option ${
                    sortOption === SORT_OPTIONS.HOT ? "active" : ""
                  }`}
                  onClick={() => handleSortChange(SORT_OPTIONS.HOT)}
                >
                  Hot (Highest Volume)
                </button>
                <button
                  className={`sort-option ${
                    sortOption === SORT_OPTIONS.NEW ? "active" : ""
                  }`}
                  onClick={() => handleSortChange(SORT_OPTIONS.NEW)}
                >
                  New (Recently Added)
                </button>
                {/* For Me option - to be implemented */}
                <button
                  className={`sort-option ${
                    sortOption === SORT_OPTIONS.FOR_ME ? "active" : ""
                  }`}
                  onClick={() => handleSortChange(SORT_OPTIONS.FOR_ME)}
                  disabled
                >
                  For Me (Coming Soon)
                </button>
              </div>
            )}
          </div>
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
              onUpdateAvailableGames={updateAvailableGames}
              sortOption={sortOption}
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
              isLoading={isInitialLoading}
              sortOption={sortOption}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
