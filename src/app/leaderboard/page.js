"use client";

import Sidebar2 from "@/components/Sidebar2";
import "./leaderboard.css";
import { useQuery } from "@tanstack/react-query";
import { QueryURL } from "../config";
import { gql, request } from "graphql-request";

const LeaderboardPage = () => {
  const url = QueryURL;
  const gql_query = gql`
    {
      users(
        where: { total_winnings_gt: "0" }
        first: 100
        orderBy: total_winnings
        orderDirection: desc
      ) {
        id
        total_winnings
      }
    }
  `;

  const query = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      return await request(url, gql_query);
    },
  });

  return (
    <div className="mainContent">
      <Sidebar2 />
      <div className="container leaderboard-content">
        <h1>Leaderboard</h1>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Total Winnings</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.id}</td>
                <td>${user.total_winnings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;
