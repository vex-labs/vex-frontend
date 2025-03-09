"use client";

import { useState, useEffect } from "react";
import Sidebar2 from "@/components/Sidebar2";
import "./leaderboard.css";
import { useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { useTour } from "@reactour/tour";

const LeaderboardPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "total_winnings",
    direction: "desc",
  });
  const { isOpen } = useTour();

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isOpen]);

  const itemsPerPage = 10;

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
      const res = await fetch("/api/gql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gql: gql_query,
        }),
      });

      const data = await res.json();

      return data;
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

  // Handle sorting
  const requestSort = (key) => {
    let direction = "desc";

    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }

    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Add sort indicators to table headers
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
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

  // Sort users based on current sort configuration
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key === "total_winnings") {
      return sortConfig.direction === "asc"
        ? parseFloat(a.total_winnings) - parseFloat(b.total_winnings)
        : parseFloat(b.total_winnings) - parseFloat(a.total_winnings);
    } else if (sortConfig.key === "number_of_wins") {
      return sortConfig.direction === "asc"
        ? a.number_of_wins - b.number_of_wins
        : b.number_of_wins - a.number_of_wins;
    }
    return 0;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

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
          <div className="leaderboard-search-container">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="leaderboard-search-input"
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
                    <th
                      onClick={() => requestSort("total_winnings")}
                      className="sortable-header"
                    >
                      Total Winnings
                      {getSortIndicator("total_winnings")}
                    </th>
                    <th
                      onClick={() => requestSort("number_of_wins")}
                      className="sortable-header"
                    >
                      Wins
                      {getSortIndicator("number_of_wins")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => {
                      // Display rank based on current sorting and pagination
                      const displayRank =
                        sortConfig.key === "total_winnings" &&
                        sortConfig.direction === "desc"
                          ? user.originalRank
                          : indexOfFirstItem + index + 1;

                      return (
                        <tr
                          key={user.id}
                          className={
                            sortConfig.key === "total_winnings" &&
                            sortConfig.direction === "desc"
                              ? `rank-${user.originalRank}`
                              : ""
                          }
                        >
                          <td className="rank-cell">
                            {sortConfig.key === "total_winnings" &&
                            sortConfig.direction === "desc" &&
                            displayRank <= 3 ? (
                              <div
                                className={`trophy ${getTrophyColor(
                                  displayRank
                                )}`}
                              >
                                {displayRank}
                              </div>
                            ) : (
                              <div className="trophy normal">{displayRank}</div>
                            )}
                          </td>
                          <td className="username-cell">
                            {user.id.replace(".users.betvex.testnet", "")}
                          </td>
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
                {Math.min(indexOfLastItem, sortedUsers.length)} of{" "}
                {sortedUsers.length} players
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
