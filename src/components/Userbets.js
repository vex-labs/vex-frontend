import React, { useEffect, useState, useCallback } from "react";
import { VexContract, QueryURL } from "@/app/config";
import { DropdownMenu } from "radix-ui";
import { gql, request } from "graphql-request";
import {
  Loader2,
  Check,
  X,
  Award,
  Clock,
  AlertTriangle,
  HistoryIcon,
} from "lucide-react";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useNear } from "@/app/context/NearContext";

/**
 * Enhanced UserBets component
 *
 * This component displays the user's bets and allows them to claim their winnings.
 * It fetches match details to determine if bets were won or lost.
 * It categorizes bets by their status (claimable, pending, error, history).
 * Lost bets are automatically shown in history, and won bets move to history after claiming.
 *
 * @param {Object} props - The component props
 * @param {Array} props.userBets - Array of user's bet objects
 *
 * @returns {JSX.Element} The rendered UserBets component
 */

const UserBets = ({ userBets }) => {
  // Get authentication contexts
  const {
    web3auth,
    nearConnection,
    accountId: web3authAccountId,
  } = useWeb3Auth();
  const { wallet, signedAccountId } = useNear();
  const [betToClaim, setBetToClaim] = useState(null);
  const [claimedBets, setClaimedBets] = useState({}); // Track successfully claimed bets
  const [activeCategory, setActiveCategory] = useState("claimable");
  const [matchResults, setMatchResults] = useState({});
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [currentClaimingBet, setCurrentClaimingBet] = useState(null);
  const { toggleRefreshBalances } = useGlobalContext();

  // Build the GraphQL query to fetch match results
  const buildMatchResultsQuery = (matchIds) => {
    return gql`
      {
        matches(
          where: { id_in: [${matchIds.map((id) => `"${id}"`).join(",")}] }
        ) {
          id
          game
          date_timestamp
          date_string
          team_1
          team_2
          winner
          match_state
        }
      }
    `;
  };

  // Fetch match results for all finished matches
  const fetchMatchResults = useCallback(async () => {
    const finishedBets = userBets.filter(
      (bet) => bet.match_state === "Finished" && !bet.pay_state
    );

    if (finishedBets.length === 0) return;

    const matchIds = finishedBets.map((bet) => bet.match_id);
    if (matchIds.length === 0) return;

    setIsLoadingResults(true);
    try {
      const query = buildMatchResultsQuery(matchIds);
      const data = await request(QueryURL, query);

      // Create a map of match ID to winner
      const resultMap = {};
      data.matches.forEach((match) => {
        resultMap[match.id] = match.winner;
      });

      setMatchResults(resultMap);
    } catch (error) {
      console.error("Failed to fetch match results:", error);
    } finally {
      setIsLoadingResults(false);
    }
  }, [userBets]);

  // Fetch match results when user bets change
  useEffect(() => {
    fetchMatchResults();
  }, [fetchMatchResults, userBets]);

  const handleClaim = async (betId) => {
    setIsClaiming(true);
    setCurrentClaimingBet(betId);

    try {
      const contractId = VexContract;
      const gas = "300000000000000";
      const args = { bet_id: betId };

      // If using Web3Auth
      if (web3auth?.connected) {
        const account = await nearConnection.account(web3authAccountId);
        await account.functionCall({
          contractId: contractId,
          methodName: "claim",
          args: args,
          gas,
          attachedDeposit: "0",
        });

        console.log("Claim successful!");
        setClaimedBets((prev) => ({ ...prev, [betId]: true }));
      }
      // If using NEAR Wallet
      else if (signedAccountId && wallet) {
        const outcome = await wallet.callMethod({
          contractId: contractId,
          method: "claim",
          args,
          gas: "300000000000000",
          deposit: "0",
        });

        console.log("Claim successful!", outcome);
        setClaimedBets((prev) => ({ ...prev, [betId]: true }));
      } else {
        throw new Error("Wallet is not initialized");
      }
    } catch (error) {
      console.error("Failed to claim bet:", error.message || error);

      // Check for error type and display more specific message
      if (error.message && error.message.includes("User rejected")) {
        alert("Claim cancelled by user");
      } else if (
        error.message &&
        error.message.includes("Insufficient balance")
      ) {
        alert("Insufficient gas to complete the transaction");
      } else {
        alert("Claim Failed: " + (error.message || "Unknown error"));
      }

      throw error;
    } finally {
      setIsClaiming(false);
      setCurrentClaimingBet(null);
      setTimeout(() => {
        toggleRefreshBalances();
      }, 3000);
    }
  };

  // Determine if a bet was won based on match results
  const didBetWin = (bet) => {
    if (!matchResults[bet.match_id]) return false;
    const winnerTeam = matchResults[bet.match_id];

    // Check if the bet was placed on the winning team
    return (
      (winnerTeam === "Team1" && bet.team === "Team1") ||
      (winnerTeam === "Team2" && bet.team === "Team2")
    );
  };

  // Filter bets into categories with improved history handling
  const createBetCategories = () => {
    // Claimable bets are only won bets that haven't been claimed
    const claimableBets = userBets.filter(
      (bet) =>
        bet.match_state === "Finished" &&
        !bet.pay_state &&
        !claimedBets[bet.betId] &&
        didBetWin(bet)
    );

    // Pending bets are matches that haven't finished yet
    const pendingBets = userBets.filter(
      (bet) => bet.match_state === "Future" || bet.match_state === "Current"
    );

    // Error bets are eligible for refunds
    const errorBets = userBets.filter(
      (bet) =>
        bet.match_state === "Error" && !bet.pay_state && !claimedBets[bet.betId]
    );

    // History includes:
    // 1. Lost bets (finished but user didn't win)
    // 2. Successfully claimed bets (won and claimed)
    // 3. Bets marked as paid in contract
    const historyBets = userBets.filter(
      (bet) =>
        // Already paid/settled bets
        bet.pay_state === "Paid" ||
        bet.pay_state === "RefundPaid" ||
        // Successfully claimed in current session
        claimedBets[bet.betId] ||
        // Lost bets (finished, has results, but user didn't win)
        (bet.match_state === "Finished" &&
          matchResults[bet.match_id] &&
          !didBetWin(bet))
    );

    return {
      claimable: claimableBets,
      pending: pendingBets,
      error: errorBets,
      history: historyBets,
    };
  };

  const betCategories = createBetCategories();

  // Get the current active bets based on selected category
  const getActiveBets = () => {
    return betCategories[activeCategory] || [];
  };

  // Helper function to get the outcome text for a bet in history
  const getBetOutcomeText = (bet) => {
    if (bet.pay_state) {
      return bet.pay_state; // "Paid" or "RefundPaid"
    }

    if (claimedBets[bet.betId]) {
      return "Claimed";
    }

    if (bet.match_state === "Finished") {
      // Check if this was a win or loss
      if (didBetWin(bet)) {
        return "Won";
      } else {
        return "Lost";
      }
    }

    return bet.match_state;
  };

  // Helper function to get CSS class for bet outcome
  const getBetOutcomeClass = (bet) => {
    if (bet.pay_state) {
      return "status-settled";
    }

    if (claimedBets[bet.betId]) {
      return "status-claimed";
    }

    if (bet.match_state === "Finished") {
      if (didBetWin(bet)) {
        return "status-won";
      } else {
        return "status-lost";
      }
    }

    if (bet.match_state === "Error") {
      return "status-error";
    }

    return "status-pending";
  };

  console.log(userBets);

  // Create tab navigation with counts
  const renderTabs = () => {
    return (
      <div className="bet-tabs">
        <button
          className={`tab-button ${
            activeCategory === "claimable" ? "active" : ""
          }`}
          onClick={() => setActiveCategory("claimable")}
        >
          <Award size={16} />
          Claimable{" "}
          {betCategories.claimable.length > 0 &&
            `(${betCategories.claimable.length})`}
        </button>
        <button
          className={`tab-button ${
            activeCategory === "pending" ? "active" : ""
          }`}
          onClick={() => setActiveCategory("pending")}
        >
          <Clock size={16} />
          Pending{" "}
          {betCategories.pending.length > 0 &&
            `(${betCategories.pending.length})`}
        </button>
        <button
          className={`tab-button ${activeCategory === "error" ? "active" : ""}`}
          onClick={() => setActiveCategory("error")}
        >
          <AlertTriangle size={16} />
          Error{" "}
          {betCategories.error.length > 0 && `(${betCategories.error.length})`}
        </button>
        <button
          className={`tab-button ${
            activeCategory === "history" ? "active" : ""
          }`}
          onClick={() => setActiveCategory("history")}
        >
          <HistoryIcon size={16} />
          History{" "}
          {betCategories.history.length > 0 &&
            `(${betCategories.history.length})`}
        </button>
      </div>
    );
  };

  return (
    <section className="active-bets">
      <h2>My Bets</h2>

      {renderTabs()}

      <div className="bet-container">
        {isLoadingResults && (
          <div className="loading-message">
            <Loader2 className="loader-icon" size={18} /> Loading bet results...
          </div>
        )}
        {getActiveBets().length > 0 ? (
          getActiveBets().map((bet, index) => {
            const {
              match_id,
              team,
              bet_amount,
              potential_winnings,
              match_state,
              betId,
            } = bet;
            const matchParts = match_id.split("-");
            const formattedMatchId = `${matchParts[0].replace(
              "_",
              " "
            )} vs ${matchParts[1].replace("_", " ")}`;

            console.log(bet);

            // Determine if bet is claimable (only in claimable tab)
            const isClaimable =
              activeCategory === "claimable" ||
              (activeCategory === "error" &&
                match_state === "Error" &&
                !bet.pay_state &&
                !claimedBets[betId]);

            // Get appropriate button labels
            const buttonLabel =
              match_state === "Error" ? "Claim Refund" : "Claim Winnings";

            // For history, determine if this was a win or loss
            const outcomeText =
              activeCategory === "history" ? getBetOutcomeText(bet) : "";
            const outcomeClass =
              activeCategory === "history" ? getBetOutcomeClass(bet) : "";

            return (
              <div
                key={index}
                className={`bet-item ${
                  activeCategory === "claimable" ? "winning-bet" : ""
                }`}
              >
                <div className="bet-status">
                  <div className="bet-status-container">
                    <p className="bet-id">#{betId}</p>
                    <p
                      className={`status-badge ${
                        activeCategory === "claimable"
                          ? "status-won"
                          : activeCategory === "pending"
                          ? "status-pending"
                          : activeCategory === "error"
                          ? "status-error"
                          : outcomeClass
                      }`}
                    >
                      {activeCategory === "claimable"
                        ? "Ready to Claim"
                        : activeCategory === "pending"
                        ? match_state
                        : activeCategory === "error"
                        ? "Refund Available"
                        : outcomeText}
                    </p>
                  </div>
                  <div>
                    {isClaimable && (
                      <button
                        className={`claim-button ${
                          isClaiming && currentClaimingBet === betId
                            ? "claiming"
                            : ""
                        }`}
                        onClick={() => handleClaim(betId)}
                        disabled={isClaiming}
                      >
                        {isClaiming && currentClaimingBet === betId ? (
                          <>
                            <Loader2 size={16} className="loader-icon" />
                            Claiming...
                          </>
                        ) : (
                          buttonLabel
                        )}
                      </button>
                    )}

                    {/* Display Claim Successful message if claim is successful */}
                    {claimedBets[betId] && activeCategory !== "history" && (
                      <p className="claim-successful-message">
                        <Check size={16} /> Claimed Successfully!
                      </p>
                    )}
                  </div>
                </div>
                <div className="bet-details">
                  <p className="match-name">{formattedMatchId}</p>
                  <p className="team-name-bets">
                    <span className="bet-on-label">Bet on:</span>{" "}
                    {team === "Team1"
                      ? matchParts[0].replace("_", " ")
                      : matchParts[1].replace("_", " ")}
                  </p>
                </div>
                <DropdownMenu.Separator className="bet-separator" />
                <div className="bet-amounts">
                  <div className="bet-amount-container">
                    <p className="amount-label">Bet Amount</p>
                    <p className="amount-value">
                      ${(bet_amount / Math.pow(10, 6)).toFixed(2)}{" "}
                      <span className="currency">USDC</span>
                    </p>
                  </div>
                  <div className="winnings-amount-container">
                    <p className="amount-label">
                      {activeCategory === "claimable"
                        ? "Winnings"
                        : activeCategory === "history" && didBetWin(bet)
                        ? "Winnings"
                        : "Potential Winnings"}
                    </p>
                    <p
                      className={`amount-value ${
                        activeCategory === "claimable" ||
                        (activeCategory === "history" && didBetWin(bet))
                          ? "won-value"
                          : "potential-value"
                      }`}
                    >
                      ${(potential_winnings / Math.pow(10, 6)).toFixed(2)}{" "}
                      <span className="currency">USDC</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-bets-message">
            <p>No {activeCategory} bets found.</p>
            {activeCategory === "claimable" && isLoadingResults && (
              <p className="loading-details">Checking match results...</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default UserBets;
