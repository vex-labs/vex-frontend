import React, { useEffect, useCallback } from "react";
import GameCard from "./GameCard";
import { gql } from "graphql-request";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { useTour } from "@reactour/tour";

/**
 * Enhanced FeaturedGames component
 *
 * This component renders a list of featured games with improved UI/UX,
 * loading states, error handling, filtering/search support, and sorting options.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Global loading state from parent
 * @param {string} props.selectedGame - Currently selected game filter
 * @param {string} props.searchTerm - Search term for filtering matches
 * @param {Function} props.onUpdateAvailableGames - Callback to update available games
 * @param {string} props.sortOption - The current sort option (upcoming, distant, hot, new, for_me)
 *
 * @returns {JSX.Element} The rendered FeaturedGames component
 */
const FeaturedGames = ({
  isLoading: parentIsLoading,
  selectedGame,
  searchTerm = "",
  onUpdateAvailableGames,
  sortOption = "hot", // Default to Hot if not provided
}) => {
  const { isOpen, currentStep } = useTour();
  const showDummyGame = isOpen;

  // Build the GraphQL query with game filter if provided
  const buildQuery = () => {
    let whereClause = "{ match_state: Future }";

    if (selectedGame) {
      whereClause = `{ match_state: Future, game: "${selectedGame}" }`;
    }

    // The orderBy and orderDirection are handled client-side
    // with our sorting logic, but we still need to fetch the fields
    return gql`
      {
        matches(
          where: ${whereClause}
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

  // Fetch featured games with React Query
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["featuredGames", selectedGame],
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
    // Skip the query if showDummyGame is true
    enabled: !showDummyGame,
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
    // If in tour mode, return empty array as we'll show the dummy game
    if (showDummyGame) return [];

    const filteredMatches = filterMatchesBySearch(data?.matches);

    if (!filteredMatches) return [];

    // Sort based on the selected sort option
    const sortedMatches = [...filteredMatches].sort((a, b) => {
      if (sortOption === "upcoming") {
        // Sort by closest date first
        return a.date_timestamp - b.date_timestamp;
      } else if (sortOption === "distant") {
        // Sort by furthest date first
        return b.date_timestamp - a.date_timestamp;
      } else if (sortOption === "hot") {
        // Sort by highest bet volume
        const maxBetsA = Math.max(a.team_1_total_bets, a.team_2_total_bets);
        const maxBetsB = Math.max(b.team_1_total_bets, b.team_2_total_bets);
        return maxBetsB - maxBetsA;
      } else if (sortOption === "new") {
        // Sort by most recently added (created_at)
        // Convert string timestamps to numbers for comparison
        const createdAtA = new Date(a.created_at).getTime();
        const createdAtB = new Date(b.created_at).getTime();
        return createdAtB - createdAtA;
      } else {
        // Default sort - by bet volume
        const maxBetsA = Math.max(a.team_1_total_bets, a.team_2_total_bets);
        const maxBetsB = Math.max(b.team_1_total_bets, b.team_2_total_bets);
        return maxBetsB - maxBetsA;
      }
    });

    return sortedMatches.slice(0, 3); // Take only the top 3
  }, [data?.matches, filterMatchesBySearch, sortOption, showDummyGame]);

  // Get team logo with fallback
  const getTeamLogo = (teamName) => {
    return `/icons/teams/${teamName}.png`;
  };

  // Format match date and time
  const formatMatchDateTime = (date_string) => {
    // Handle DD/MM/YYYY format by parsing each component
    const [day, month, year] = date_string
      .split("/")
      .map((num) => parseInt(num, 10));

    // Create date with correct components (months are 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day);

    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
    });

    return dateStr;
  };

  useEffect(() => {
    if (data?.matches && !showDummyGame) {
      const gamesSet = new Set();
      data.matches.forEach((match) => {
        if (match.game) gamesSet.add(match.game);
      });
      // Update parent component with available games
      if (onUpdateAvailableGames && gamesSet.size > 0) {
        onUpdateAvailableGames(Array.from(gamesSet));
      }
    }
  }, [data?.matches, onUpdateAvailableGames, showDummyGame]);

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="featured-grid-container">
      {[1, 2, 3].map((skeleton) => (
        <div
          key={skeleton}
          className="featured-card featured-card-4-col skeleton-card"
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
    <div className="featured-error-container">
      <AlertCircle size={32} className="error-icon" />
      <h3>Failed to load featured games</h3>
      <p>{error?.message || "Please try again later"}</p>
      <button onClick={() => refetch()} className="retry-button">
        <RefreshCw size={16} />
        <span>Retry</span>
      </button>
    </div>
  );

  // Render empty state when no matches are found
  const renderEmpty = () => (
    <div className="featured-empty-container">
      <h3>
        {searchTerm
          ? `No matches match your search "${searchTerm}"`
          : selectedGame
          ? `No featured matches available for ${selectedGame}`
          : "No featured matches available at this time."}
      </h3>
      <p>
        {searchTerm
          ? "Try a different search term or remove some filters"
          : "Check back later for upcoming matches."}
      </p>
    </div>
  );

  // Effect to dispatch resize event when in tour mode
  useEffect(() => {
    if (showDummyGame) {
      const timeout = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [showDummyGame, currentStep]);

  return (
    <section className="featured-games-section">
      <div className="section-header">
        <h1>Featured Games</h1>
      </div>

      {showDummyGame ? (
        // When in tour mode, just show the dummy game without any loading/error states
        <div className="featured-grid-container">
          <GameCard
            key={"tour-match"}
            className="featured-card featured-card-4-col"
            tournamentIcon={"/icons/events/vct_china.png"}
            tournamentName={"Example Match"}
            matchTime={"01 April"}
            team1TotalBets={100}
            team2TotalBets={200}
            team1Logo={"/icons/teams/Bad_News_Eagles.png"}
            team1Name={"Bad_News_Eagles"}
            matchId={"test-match"}
            team2Logo={"/icons/teams/Fluffy_Gangsters.png"}
            team2Name={"Fluffy_Gangsters"}
            walletBalance={100}
            isTourMatch
          />
        </div>
      ) : isLoading || parentIsLoading ? (
        renderSkeleton()
      ) : isError ? (
        renderError()
      ) : filteredAndSortedMatches.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="featured-grid-container">
          {filteredAndSortedMatches.map((match, index) => (
            <GameCard
              key={match.id || index}
              className="featured-card featured-card-4-col"
              tournamentIcon={
                match.tournament_icon || "/icons/events/vct_china.png"
              }
              tournamentName={
                match.tournament_name || match.game || "Unknown Tournament"
              }
              matchTime={formatMatchDateTime(match.date_string)}
              team1TotalBets={match.team_1_total_bets}
              team2TotalBets={match.team_2_total_bets}
              team1Logo={getTeamLogo(match.team_1)}
              team1Name={match.team_1 || "Team 1"}
              matchId={match.id}
              team2Logo={getTeamLogo(match.team_2)}
              team2Name={match.team_2 || "Team 2"}
              walletBalance={tokenBalances.USDC}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedGames;
