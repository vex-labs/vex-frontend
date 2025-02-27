import React, { useEffect } from "react";
import GameCard from "./GameCard";
import { QueryURL } from "@/app/config";
import { gql, request } from "graphql-request";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useGlobalContext } from "@/app/context/GlobalContext";

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

/**
 * Enhanced FeaturedGames component
 *
 * This component renders a list of featured games with improved UI/UX,
 * loading states, error handling, and filtering/search support.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Global loading state from parent
 * @param {string} props.selectedGame - Currently selected game filter
 * @param {string} props.searchTerm - Search term for filtering matches
 * @param {Function} props.onUpdateAvailableGames - Callback to update available games
 *
 * @returns {JSX.Element} The rendered FeaturedGames component
 */
const FeaturedGames = ({
  isLoading: parentIsLoading,
  selectedGame,
  searchTerm = "",
  onUpdateAvailableGames,
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
      return await request(QueryURL, buildQuery());
    },
  });

  // Filter matches by search term if one is provided
  const filterMatchesBySearch = (matches) => {
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
  };

  // Apply search filter and then sort the matches
  const filteredAndSortedMatches = React.useMemo(() => {
    const filteredMatches = filterMatchesBySearch(data?.matches);

    if (!filteredMatches) return [];

    return filteredMatches
      .sort((a, b) => {
        const maxBetsA = Math.max(a.team_1_total_bets, a.team_2_total_bets);
        const maxBetsB = Math.max(b.team_1_total_bets, b.team_2_total_bets);
        return maxBetsB - maxBetsA; // descending order
      })
      .slice(0, 4); // Take only the top 4
  }, [data?.matches, searchTerm]);

  // Get team logo with fallback
  const getTeamLogo = (teamName) => {
    return TEAM_ICON_MAP[teamName] || "/icons/teams/default_team.png";
  };

  // Format match date and time
  const formatMatchDateTime = (timestamp) => {
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

  useEffect(() => {
    if (data?.matches) {
      const gamesSet = new Set();
      data.matches.forEach((match) => {
        if (match.game) gamesSet.add(match.game);
      });
      // Update parent component with available games
      if (onUpdateAvailableGames && gamesSet.size > 0) {
        onUpdateAvailableGames(Array.from(gamesSet));
      }
    }
  }, [data?.matches, onUpdateAvailableGames]);

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="featured-grid-container">
      {[1, 2, 3, 4].map((skeleton) => (
        <div
          key={skeleton}
          className="featured-card featured-card-3-col skeleton-card"
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

  return (
    <section className="featured-games-section">
      <div className="section-header">
        <h1>Featured Games</h1>
        {filteredAndSortedMatches?.length > 0 && (
          <div className="match-count">
            {filteredAndSortedMatches.length} match
            {filteredAndSortedMatches.length !== 1 ? "es" : ""}
          </div>
        )}
      </div>

      {isLoading || parentIsLoading ? (
        renderSkeleton()
      ) : isError ? (
        renderError()
      ) : filteredAndSortedMatches?.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="featured-grid-container">
          {filteredAndSortedMatches.map((match, index) => (
            <GameCard
              key={match.id || index}
              className="featured-card featured-card-3-col"
              tournamentIcon={
                match.tournament_icon || "/icons/events/vct_china.png"
              }
              tournamentName={
                match.tournament_name || match.game || "Unknown Tournament"
              }
              matchTime={formatMatchDateTime(match.date_timestamp)}
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
