"use client";

import Sidebar from "@/components/Sidebar";
import FeaturedGames from "@/components/FeaturedGames";
import UpcomingGames from "@/components/UpcomingGames";
import { useEffect, useState } from "react";
import { providers } from "near-api-js";
import { fetchMatchesByIDs } from "@/utils/fetchMatches";
import { useNear } from "@/app/context/NearContext";
import { NearRpcUrl, GuestbookNearContract } from "./config";

/**
 * HomePage component
 *
 * This component serves as the main page for displaying featured and upcoming games.
 * It fetches match data from the blockchain and additional match data from the backend.
 * It also manages the state for selected games and user account information.
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

  const signedAccountId = isVexLogin
    ? null
    : nearContext?.signedAccountId || null;

  useEffect(() => {
    // Fetch vexAccountId from localStorage on component mount
    const storedVexAccountId = localStorage.getItem("vexAccountId");
    console.log("vexAccountId from local storage:", storedVexAccountId);
    setVexAccountId(storedVexAccountId);
  }, []);

  /**
   * Handles the selection of a game from the sidebar
   *
   * @param {string} game - The selected game
   */
  const handleGameSelection = (game) => {
    setSelectedGame(game);
  };

  /**
   * Resets the selected game to null
   */
  const resetGameSelection = () => {
    setSelectedGame(null);
  };

  // Fetch matches from the blockchain (NEAR)
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const provider = new providers.JsonRpcProvider(NearRpcUrl);
        const matches = await provider.query({
          request_type: "call_function",
          account_id: GuestbookNearContract,
          method_name: "get_matches",
          args_base64: btoa(JSON.stringify({ from_index: null, limit: null })),
          finality: "final",
        });
        const decodedResult = JSON.parse(
          Buffer.from(matches.result).toString()
        );

        console.log("Matches:", decodedResult);
        setMatches(decodedResult);

        localStorage.setItem("matches", JSON.stringify(decodedResult));
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      }
    };

    fetchMatches();
  }, []);

  // Fetch additional match data from the backend
  useEffect(() => {
    const fetchAdditionalMatchData = async () => {
      if (matches.length === 0) return;

      const matchIDs = matches.map((match) => match.match_id).filter(Boolean);

      if (matchIDs.length === 0) return;

      const backendResponse = await fetchMatchesByIDs(matchIDs);
      console.log("Matches from backend:", backendResponse);

      setAdditionalMatchData(backendResponse);

      localStorage.setItem(
        "additionalMatchData",
        JSON.stringify(backendResponse)
      );
    };

    fetchAdditionalMatchData();
  }, [matches]);

  const filteredMatches = selectedGame
    ? matches.filter((match) => match.game === selectedGame)
    : matches;

  const filteredAdditionalData = additionalMatchData.filter((additionalMatch) =>
    filteredMatches.some((match) => match.match_id === additionalMatch.match_id)
  );

  return (
    <div className="container">
      <Sidebar onSelectGame={handleGameSelection} />
      <div className="mainContent">
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
          <FeaturedGames />
          <div className="header-container">
            <h1 style={{ color: "white" }}>Upcoming Games</h1>
            {selectedGame && (
              <button
                onClick={resetGameSelection}
                className="remove-filters-button"
              >
                Remove Filters
              </button>
            )}
          </div>
          {/*
         <UpcomingGames
            matches={filteredMatches}
            additionalMatchData={filteredAdditionalData}
            vexAccountId={vexAccountId}
          />
          */}
        </div>
      </div>
    </div>
  );
}
