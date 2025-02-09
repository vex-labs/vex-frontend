import React from "react";
import GameCard from "./GameCard";
import { QueryURL } from "@/app/config";
import { gql, request } from "graphql-request";
import { useQuery } from "@tanstack/react-query";

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
 * FeaturedGames component
 *
 * This component renders a list of featured games based on specified match IDs.
 * It filters the provided matches to only include those with the specified match IDs
 * and combines them with additional match data.
 *
 * @returns {JSX.Element} The rendered FeaturedGames component
 */
const FeaturedGames = () => {
  const url = QueryURL;

  const gql_query = gql`
    {
      matches(
        first: 4
        where: { match_state: Future }
        orderBy: date_timestamp
        orderDirection: desc
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

  const query = useQuery({
    queryKey: ["data"],
    queryFn: async () => {
      return await request(url, gql_query);
    },
  });

  return (
    <div>
      <h1 style={{ color: "white" }}>Featured Games</h1>
      <div className="featured-grid-container">
        {query.data?.matches.map((match, index) => (
          <GameCard
            key={match.id || index}
            className="featured-card featured-card-3-col"
            tournamentIcon={
              match.tournament_icon || "/icons/events/vct_china.png"
            }
            tournamentName={match.tournament_name || "Unknown Tournament"}
            matchTime={`${new Date(
              match.date_timestamp * 1000
            ).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
            })} ${new Date(match.date_timestamp * 1000).toLocaleTimeString(
              "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }
            )}`}
            team1Logo={TEAM_ICON_MAP[match.team_1]}
            team1Name={match.team_1 || "Team 1"}
            team2Logo={TEAM_ICON_MAP[match.team_2]}
            team2Name={match.team_2 || "Team 2"}
            odds1={parseFloat(match.team_1_odds || "1.00").toFixed(2)}
            odds2={parseFloat(match.team_2_odds || "1.00").toFixed(2)}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedGames;
