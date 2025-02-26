"use client";

import { useState } from "react";
import Sidebar2 from "@/components/Sidebar2";
import "./leaderboard.css";
import { useQuery } from "@tanstack/react-query";
import { QueryURL } from "../config";
import { gql, request } from "graphql-request";

const LeaderboardPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        number_of_wins
      }
    }
  `;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      return await request(url, gql_query);
    },
  });

  // Format winnings to proper currency display
  const formatWinnings = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 1000000); // Assuming amount is in millions (like USDC)
  };

  const usersWithRanks =
    data?.users.map((user, index) => ({
      ...user,
      originalRank: index + 1,
    })) || [];

  // Filter users based on search term
  const filteredUsers = usersWithRanks.filter((user) =>
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          &laquo;
        </button>
        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &lsaquo;
        </button>

        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`pagination-button ${
              currentPage === number ? "active" : ""
            }`}
          >
            {number}
          </button>
        ))}

        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &rsaquo;
        </button>
        <button
          className="pagination-button"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          &raquo;
        </button>
      </div>
    );
  };

  // Determine trophy color based on rank
  const getTrophyColor = (rank) => {
    if (rank === 1) return "gold-trophy";
    if (rank === 2) return "silver-trophy";
    if (rank === 3) return "bronze-trophy";
    return "";
  };

  return (
    <div className="mainContent">
      <Sidebar2 />
      <div className="container leaderboard-content">
        <div className="leaderboard-header">
          <h1>Leaderboard</h1>
          <p className="leaderboard-subtitle">
            Top players with the highest winnings
          </p>
        </div>

        <div className="leaderboard-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="loading-spinner-leaderboard">
            <div className="spinner"></div>
            <p>Loading leaderboard data...</p>
          </div>
        ) : isError ? (
          <div className="error-message">
            <p>
              Error loading leaderboard: {error?.message || "Unknown error"}
            </p>
            <button
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Username</th>
                    <th>Total Winnings</th>
                    <th>Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => {
                      return (
                        <tr
                          key={user.id}
                          className={`rank-${
                            user.originalRank
                          } ${getTrophyColor(user.originalRank)}`}
                        >
                          <td className="rank-cell">
                            {user.originalRank <= 3 ? (
                              <div
                                className={`trophy ${getTrophyColor(
                                  user.originalRank
                                )}`}
                              >
                                {user.originalRank}
                              </div>
                            ) : (
                              user.originalRank
                            )}
                          </td>
                          <td className="username-cell">{user.id}</td>
                          <td className="winnings-cell">
                            {formatWinnings(user.total_winnings)}
                          </td>
                          <td className="wins-cell">
                            {user.number_of_wins || 0}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-results">
                        No users found matching &quot;{searchTerm}&quot;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}

            <div className="leaderboard-footer">
              <p>
                Showing {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredUsers.length)} of{" "}
                {filteredUsers.length} players
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
