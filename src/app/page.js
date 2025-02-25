"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { providers } from "near-api-js";
import { fetchMatchesByIDs } from "@/utils/fetchMatches";
import { useNear } from "@/app/context/NearContext";
import { NearRpcUrl, GuestbookNearContract } from "./config";

import Sidebar from "@/components/Sidebar";
import FeaturedGames from "@/components/FeaturedGames";
import UpcomingGames from "@/components/UpcomingGames";
import { FilterX, Loader } from "lucide-react";

/**
 * Enhanced HomePage component
 *
 * This component serves as the main page for displaying featured and upcoming games.
 * It includes improved loading states, error handling, and filtering.
 *
 * @param {Object} props - The component props
 * @param {boolean} props.isVexLogin - Indicates if the user is logged in with VEX
 * @param {Object} props.vexKeyPair - The VEX key pair for the user
 *
 * @returns {JSX.Element} The rendered HomePage component
 */
export default function HomePage({ isVexLogin, vexKeyPair }) {
  const nearContext = useNear();
  const [matches, setMatches] = useState([]);
  const [additionalMatchData, setAdditionalMatchData] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [vexAccountId, setVexAccountId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const signedAccountId = isVexLogin
    ? null
    : nearContext?.signedAccountId || null;

  // Get vexAccountId from localStorage
  useEffect(() => {
    const storedVexAccountId = localStorage.getItem("vexAccountId");
    setVexAccountId(storedVexAccountId);
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

  // Fetch matches from the blockchain (NEAR)
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        // First try to get from cache for immediate display
        const cachedMatches = localStorage.getItem("matches");
        if (cachedMatches) {
          setMatches(JSON.parse(cachedMatches));
        }

        // Then fetch fresh data
        const provider = new providers.JsonRpcProvider(NearRpcUrl);
        const response = await provider.query({
          request_type: "call_function",
          account_id: GuestbookNearContract,
          method_name: "get_matches",
          args_base64: btoa(JSON.stringify({ from_index: null, limit: null })),
          finality: "final",
        });

        const decodedResult = JSON.parse(
          Buffer.from(response.result).toString()
        );

        // Update state and cache
        setMatches(decodedResult);
        localStorage.setItem("matches", JSON.stringify(decodedResult));
      } catch (error) {
        console.error("Failed to fetch matches:", error);
        setHasError(true);
        setErrorMessage("Failed to load matches. Please try again later.");

        // Fall back to cached data if available
        const cachedMatches = localStorage.getItem("matches");
        if (cachedMatches) {
          setMatches(JSON.parse(cachedMatches));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Fetch additional match data from the backend
  useEffect(() => {
    const fetchAdditionalMatchData = async () => {
      if (matches.length === 0) return;

      try {
        // First try to get from cache for immediate display
        const cachedData = localStorage.getItem("additionalMatchData");
        if (cachedData) {
          setAdditionalMatchData(JSON.parse(cachedData));
        }

        const matchIDs = matches.map((match) => match.match_id).filter(Boolean);
        if (matchIDs.length === 0) return;

        const backendResponse = await fetchMatchesByIDs(matchIDs);

        // Update state and cache
        setAdditionalMatchData(backendResponse);
        localStorage.setItem(
          "additionalMatchData",
          JSON.stringify(backendResponse)
        );
      } catch (error) {
        console.error("Failed to fetch additional match data:", error);

        // Fall back to cached data if available
        const cachedData = localStorage.getItem("additionalMatchData");
        if (cachedData) {
          setAdditionalMatchData(JSON.parse(cachedData));
        }
      }
    };

    fetchAdditionalMatchData();
  }, [matches]);

  // Filtered matches based on selected game
  const filteredMatches = useMemo(() => {
    return selectedGame
      ? matches.filter((match) => match.game === selectedGame)
      : matches;
  }, [matches, selectedGame]);

  // Filtered additional match data
  const filteredAdditionalData = useMemo(() => {
    return additionalMatchData.filter((additionalMatch) =>
      filteredMatches.some(
        (match) => match.match_id === additionalMatch.match_id
      )
    );
  }, [filteredMatches, additionalMatchData]);

  // Get available games for filter menu
  const availableGames = useMemo(() => {
    const gamesSet = new Set();
    matches.forEach((match) => {
      if (match.game) gamesSet.add(match.game);
    });
    return Array.from(gamesSet);
  }, [matches]);

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
            <FeaturedGames isLoading={isLoading} selectedGame={selectedGame} />
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

            {isLoading && !filteredMatches.length ? (
              <div className="loading-state">
                <Loader size={30} className="loading-spinner" />
                <p>Loading matches...</p>
              </div>
            ) : hasError ? (
              <div className="error-state">
                <p>{errorMessage}</p>
                <button
                  className="retry-button"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="empty-state">
                <p>
                  No upcoming matches available
                  {selectedGame ? ` for ${selectedGame}` : ""}.
                </p>
                {selectedGame && (
                  <button
                    onClick={resetGameSelection}
                    className="clear-filter-button"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              <UpcomingGames
                matches={filteredMatches}
                additionalMatchData={filteredAdditionalData}
                vexAccountId={vexAccountId}
                isLoading={isLoading}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
