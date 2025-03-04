import React, { useCallback } from "react";
import GameCard from "./GameCard";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { RefreshCw, AlertCircle } from "lucide-react";
import { gql } from "graphql-request";
import { useQuery } from "@tanstack/react-query";
import { TEAM_ICON_MAP } from "@/data/team-icons";
import { GAME_LABELS } from "@/data/games";

/**
 * Enhanced UpcomingGames component using GraphQL
 *
 * This component fetches and displays a list of upcoming game matches using GraphQL,
 * with improved UI/UX, loading states, and error handling.
 *
 * @param {Object} props - The component props
 * @param {boolean} props.isLoading - Global loading state from parent
 * @param {string} props.selectedGame - Currently selected game filter
 * @param {string} props.searchTerm - Search term for filtering matches
 *
 * @returns {JSX.Element} The rendered UpcomingGames component
 */
const UpcomingGames = ({
  isLoading: parentIsLoading,
  selectedGame,
  searchTerm,
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

  // Fetch upcoming games with React Query
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["upcomingGames", selectedGame],
    queryFn: async () => {
      const res = await fetch("/api/gql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gql: buildQuery(),
        }),
      });

      const data = await res.json();

      return data;
    },
  });

  // Filter matches by search term if one is provided
  const filterMatchesBySearch = useCallback(
    (matches) => {
      if (!searchTerm || !matches) return matches;

      const lowercasedSearch = searchTerm.toLowerCase();

      return matches.filter((match) => {
        // Search in team names
        const team1NameMatch = match.team_1
          ?.toLowerCase()
          .includes(lowercasedSearch);
        const team2NameMatch = match.team_2
          ?.toLowerCase()
          .includes(lowercasedSearch);

        // Search in game name
        const gameMatch = match.game?.toLowerCase().includes(lowercasedSearch);

        // Search in date string
        const dateMatch = match.date_string
          ?.toLowerCase()
          .includes(lowercasedSearch);

        // Return true if any field matches the search term
        return team1NameMatch || team2NameMatch || gameMatch || dateMatch;
      });
    },
    [searchTerm]
  );

  // Apply search filter and then sort the matches
  const filteredAndSortedMatches = React.useMemo(() => {
    const filteredMatches = filterMatchesBySearch(data?.matches);

    if (!filteredMatches) return [];

    return filteredMatches.sort((a, b) => {
      const maxBetsA = Math.max(a.team_1_total_bets, a.team_2_total_bets);
      const maxBetsB = Math.max(b.team_1_total_bets, b.team_2_total_bets);
      return maxBetsB - maxBetsA; // descending order
    });
  }, [data?.matches, filterMatchesBySearch]);

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
    <div className="featured-empty-container">
      <h3>
        {searchTerm
          ? `No upcoming matches available for your search "${searchTerm}"`
          : selectedGame
          ? `No upcoming matches available for ${selectedGame}`
          : "No upcoming matches available at this time."}
      </h3>
      <p>
        {searchTerm
          ? "Try a different search term or remove some filters"
          : "Check back later for upcoming matches."}
      </p>
    </div>
  );

  return (
    <section className="upcoming-games-section">
      {isLoading || parentIsLoading ? (
        renderSkeleton()
      ) : isError ? (
        renderError()
      ) : filteredAndSortedMatches?.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="upcoming-grid-container">
          {filteredAndSortedMatches.map((match, index) => (
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
              walletBalance={tokenBalances.USDC}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default UpcomingGames;
