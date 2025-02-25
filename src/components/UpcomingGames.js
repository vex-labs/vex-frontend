import React, { useState } from "react";
import GameCard from "./GameCard";
import { useNear } from "@/app/context/NearContext";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { RefreshCw, AlertCircle, Calendar } from "lucide-react";
import { QueryURL } from "@/app/config";
import { gql, request } from "graphql-request";
import { useQuery } from "@tanstack/react-query";

// Team icon mapping with fallback handling
const TEAM_ICON_MAP = {
  KRÜ_BLAZE: "/icons/teams/kru_blaze.png",
  FlyQuest_RED: "/icons/teams/flyquest_red.png",
  SSG: "/icons/teams/ssg.png",
  Team_Falcons: "/icons/teams/team_falcons.png",
  Toronto_Defiant: "/icons/teams/toronto_defiant.png",
  Crazy_Raccoon: "/icons/teams/crazy_raccon.png",
  Team_Spirit: "/icons/teams/team_spirit.png",
  Faze: "/icons/teams/faze.png",
  Natus_Vincere: "/icons/teams/natus_vincere.png",
  Shopify_Rebellion: "/icons/teams/shopify_rebellion.png",
  Xipto_Esports: "/icons/teams/xipto_esport.png",
  ENCE: "/icons/teams/ence.png",
  NRG_Shock: "/icons/teams/nrg_shock.png",
  NTMR: "/icons/teams/ntmr.png",
  Twisted_Minds: "/icons/teams/twisted_minds.png",
  Astralis: "/icons/teams/astralis.png",
  "9_Pandas": "/icons/teams/9_pandas.png",
  Cloud9: "/icons/teams/cloud9.png",
};

// Game name to display label mapping
const GAME_LABELS = {
  "counter-strike-2": "Counter Strike 2",
  lol: "League of Legends",
  valorant: "Valorant",
  fortnite: "Fortnite",
  apex: "Apex Legends",
  rainbowsix: "Rainbow Six Siege",
  dota2: "Dota 2",
  "overwatch-2": "Overwatch 2",
};

/**
 * Enhanced UpcomingGames component using GraphQL
 *
 * This component fetches and displays a list of upcoming game matches using GraphQL,
 * with improved UI/UX, loading states, and error handling.
 *
 * @param {Object} props - The component props
 * @param {boolean} props.isLoading - Global loading state from parent
 * @param {string} props.selectedGame - Currently selected game filter
 * @param {Object} props.wallet - Wallet object for handling transactions
 * @param {string} props.vexAccountId - User's VEX account ID
 *
 * @returns {JSX.Element} The rendered UpcomingGames component
 */
const UpcomingGames = ({
  isLoading: parentIsLoading,
  selectedGame,
  wallet,
  vexAccountId,
}) => {
  // Build the GraphQL query with game filter if provided
  const buildQuery = () => {
    let whereClause = "{ match_state: Future }";

    if (selectedGame) {
      whereClause = `{ match_state: Future, game: "${selectedGame}" }`;
    }

    return gql`
      {
        matches(
          first: 12
          where: ${whereClause}
          orderBy: date_timestamp
          orderDirection: asc
          skip: 4 # Skip the first 4 matches (featured ones)
        ) {
          id
          game
          date_timestamp
          date_string
          team_1
          team_2
          team_1_total_bets
          team_2_total_bets
          match_state
          created_at
        }
      }
    `;
  };

  const { tokenBalances } = useGlobalContext();
  const nearContext = useNear();
  const connectedWallet = wallet || nearContext?.wallet || null;

  // Fetch upcoming games with React Query
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["upcomingGames", selectedGame],
    queryFn: async () => {
      return await request(QueryURL, buildQuery());
    },
  });

  // Get team logo with fallback
  const getTeamLogo = (teamName) => {
    return TEAM_ICON_MAP[teamName] || "/icons/teams/default_team.png";
  };

  // Format match date and time
  const formatMatchDateTime = (timestamp) => {
    if (!timestamp) return "Date TBD";

    const date = new Date(timestamp * 1000);

    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
    });

    const timeStr = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${dateStr} ${timeStr}`;
  };

  // Get formatted game name
  const getGameLabel = (gameName) => {
    return GAME_LABELS[gameName] || gameName || "Unknown Game";
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="upcoming-grid-container">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((skeleton) => (
        <div
          key={skeleton}
          className="upcoming-card upcoming-card-4-col skeleton-card"
        >
          <div className="skeleton-header"></div>
          <div className="skeleton-body">
            <div className="skeleton-team"></div>
            <div className="skeleton-vs"></div>
            <div className="skeleton-team"></div>
          </div>
          <div className="skeleton-odds"></div>
        </div>
      ))}
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="upcoming-error-container">
      <AlertCircle size={32} className="error-icon" />
      <h3>Failed to load upcoming games</h3>
      <p>{error?.message || "Please try again later"}</p>
      <button onClick={() => refetch()} className="retry-button">
        <RefreshCw size={16} />
        <span>Retry</span>
      </button>
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div className="upcoming-empty-container">
      <Calendar size={32} className="empty-icon" />
      <h3>
        No upcoming matches available
        {selectedGame ? ` for ${getGameLabel(selectedGame)}` : ""}.
      </h3>
      <p>Check back later for upcoming matches.</p>
    </div>
  );

  return (
    <section className="upcoming-games-section">
      {isLoading || parentIsLoading ? (
        renderSkeleton()
      ) : isError ? (
        renderError()
      ) : data?.matches?.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="upcoming-grid-container">
          {data.matches.map((match, index) => (
            <GameCard
              key={match.id || index}
              className="upcoming-card upcoming-card-4-col"
              tournamentIcon={
                match.tournament_icon || "/icons/events/vct_china.png"
              }
              tournamentName={match.game || "Unknown Tournament"}
              matchTime={formatMatchDateTime(match.date_timestamp)}
              team1TotalBets={match.team_1_total_bets}
              team2TotalBets={match.team_2_total_bets}
              team1Logo={getTeamLogo(match.team_1)}
              team1Name={match.team_1 || "Team 1"}
              team2Logo={getTeamLogo(match.team_2)}
              team2Name={match.team_2 || "Team 2"}
              matchId={match.id}
              wallet={connectedWallet}
              vexAccountId={vexAccountId}
              walletBalance={tokenBalances.USDC}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default UpcomingGames;
