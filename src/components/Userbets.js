import React, { useEffect, useState, useCallback } from "react";
import { VexContract } from "@/app/config";
import { DropdownMenu } from "radix-ui";
import { gql } from "graphql-request";
import { Loader2, Check, Award, Clock, HistoryIcon } from "lucide-react";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useNear } from "@/app/context/NearContext";
import { actionCreators, encodeSignedDelegate } from "@near-js/transactions";
import { useTour } from "@reactour/tour";

const UserBets = ({ userBets = [], showTourExampleForStep9 = false }) => {
  // Get authentication contexts
  const {
    web3auth,
    nearConnection,
    accountId: web3authAccountId,
  } = useWeb3Auth();
  const { wallet, signedAccountId } = useNear();
  const { accountId } = useGlobalContext();
  const [claimedBets, setClaimedBets] = useState({}); // Track successfully claimed bets
  const [activeCategory, setActiveCategory] = useState("claimable");
  const [matchResults, setMatchResults] = useState({});
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [currentClaimingBet, setCurrentClaimingBet] = useState(null);
  const { toggleRefreshBalances } = useGlobalContext();
  const { currentStep, setCurrentStep } = useTour();

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
    // Skip API call if we have no actual bets (unless in tour mode)
    if (userBets.length === 0 && !showTourExampleForStep9) return;

    const finishedBets = userBets.filter(
      (bet) => bet.match_state === "Finished" && !bet.pay_state
    );

    if (finishedBets.length === 0 && !showTourExampleForStep9) return;

    const matchIds = finishedBets.map((bet) => bet.match_id);
    if (matchIds.length === 0 && !showTourExampleForStep9) return;

    setIsLoadingResults(true);
    try {
      if (matchIds.length > 0) {
        const query = buildMatchResultsQuery(matchIds);
        const res = await fetch("/api/gql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gql: query,
          }),
        });

        const data = await res.json();

        // Create a map of match ID to winner
        const resultMap = {};
        data.matches.forEach((match) => {
          resultMap[match.id] = match.winner;
        });

        setMatchResults(resultMap);
      }
    } catch (error) {
      console.error("Failed to fetch match results:", error);
    } finally {
      setIsLoadingResults(false);
    }
  }, [userBets, showTourExampleForStep9]);

  useEffect(() => {
    if (showTourExampleForStep9) {
      // Force ReactTour to properly highlight the element and set active tab
      const timeout = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [showTourExampleForStep9]);

  // Fetch match results when user bets change
  useEffect(() => {
    fetchMatchResults();
  }, [fetchMatchResults]);

  const handleClaim = async (betId) => {
    // If in tour mode and at step 9, advance to step 10 and mark as claimed
    if (showTourExampleForStep9 && betId === "tour-example-bet") {
      setIsClaiming(true);
      setCurrentClaimingBet(betId);

      // Simulate claim process during tour
      setTimeout(() => {
        setClaimedBets((prev) => ({ ...prev, [betId]: true }));
        setIsClaiming(false);
        setCurrentClaimingBet(null);
        // Advance to step 10
        setCurrentStep(10);
      }, 1000);

      return;
    }

    // Regular claim process for non-tour usage
    setIsClaiming(true);
    setCurrentClaimingBet(betId);

    try {
      const contractId = VexContract;
      const gas = "300000000000000";
      const args = { bet_id: betId };

      // If using Web3Auth
      if (web3auth?.connected) {
        const account = await nearConnection.account(web3authAccountId);

        console.log("relayed transaction");

        const action = actionCreators.functionCall("claim", args, gas, "0");

        const signedDelegate = await account.signedDelegate({
          actions: [action],
          blockHeightTtl: 120,
          receiverId: contractId,
        });

        const encodedDelegate = Array.from(
          encodeSignedDelegate(signedDelegate)
        );

        // Send the signed delegate to our relay API
        const response = await fetch("/api/transactions/relay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([encodedDelegate]), // Send as array of transactions
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to relay transaction");
        }

        const { data } = await response.json();

        console.log("Relayed transaction:", data);

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

  // Create a tour example bet if we're in tour step 9
  const createTourExampleBet = () => {
    if (showTourExampleForStep9) {
      return {
        betId: "tour-example-bet",
        match_id: "Team_A-Team_B",
        team: "Team1",
        bet_amount: 25000000, // $25.00
        potential_winnings: 62500000, // $62.50
        match_state: "Finished",
        pay_state: null,
      };
    }
    return null;
  };

  // Filter bets into categories with improved handling
  const createBetCategories = () => {
    // Add tour example bet if in tour step 9
    const tourExampleBet = createTourExampleBet();
    const betsToProcess = tourExampleBet
      ? [...userBets, tourExampleBet]
      : userBets;

    // Claimable bets include both:
    // 1. Won bets that haven't been claimed
    // 2. Error bets eligible for refunds (now merged with claimable)
    const claimableBets = betsToProcess.filter(
      (bet) =>
        // Tour example bet (when in tour step 9)
        bet.betId === "tour-example-bet" ||
        // Regular winnings to claim
        (bet.match_state === "Finished" &&
          !bet.pay_state &&
          !claimedBets[bet.betId] &&
          didBetWin(bet)) ||
        // Error bets eligible for refund
        (bet.match_state === "Error" &&
          !bet.pay_state &&
          !claimedBets[bet.betId])
    );

    // Pending bets are matches that haven't finished yet
    const pendingBets = betsToProcess.filter(
      (bet) =>
        bet.betId !== "tour-example-bet" &&
        (bet.match_state === "Future" || bet.match_state === "Current")
    );

    // History includes:
    // 1. Lost bets (finished but user didn't win)
    // 2. Successfully claimed bets (won and claimed)
    // 3. Bets marked as paid in contract
    const historyBets = betsToProcess.filter(
      (bet) =>
        bet.betId !== "tour-example-bet" &&
        // Already paid/settled bets
        (bet.pay_state === "Paid" ||
          bet.pay_state === "RefundPaid" ||
          // Successfully claimed in current session
          claimedBets[bet.betId] ||
          // Lost bets (finished, has results, but user didn't win)
          (bet.match_state === "Finished" &&
            matchResults[bet.match_id] &&
            !didBetWin(bet)))
    );

    return {
      claimable: claimableBets,
      pending: pendingBets,
      history: historyBets,
    };
  };

  const betCategories = createBetCategories();

  // Get the current active bets based on selected category
  const getActiveBets = () => {
    // During tour step 9, only show the tour example bet if in claimable category
    if (showTourExampleForStep9 && activeCategory === "claimable") {
      return betCategories.claimable.filter(
        (bet) => bet.betId === "tour-example-bet"
      );
    }

    // Otherwise, filter out the tour example bet from regular usage
    if (!showTourExampleForStep9) {
      return (betCategories[activeCategory] || []).filter(
        (bet) => bet.betId !== "tour-example-bet"
      );
    }

    return betCategories[activeCategory] || [];
  };

  // Helper function to get the outcome text for a bet in history
  const getBetOutcomeText = (bet) => {
    // Tour example bet always shows as "Won"
    if (bet.betId === "tour-example-bet") {
      return "Won";
    }

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
    // Tour example bet always has "status-won" class
    if (bet.betId === "tour-example-bet") {
      return "status-won";
    }

    if (bet.pay_state === "Paid") {
      return "status-paid"; // New class for paid status
    }

    if (bet.pay_state === "RefundPaid") {
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

  // For tour only - display a message if not logged in but still showing the example
  const renderTourNote = () => {
    if (showTourExampleForStep9 && !accountId) {
      return (
        <div className="tour-note">
          <p>
            This is a demonstration example. Log in to access your actual bets.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="active-bets">
      <h2>My Bets</h2>

      {renderTourNote()}
      {renderTabs()}

      <div className="bet-container">
        {isLoadingResults && !showTourExampleForStep9 && (
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
                key={betId}
                className={`bet-item ${
                  activeCategory === "claimable" ? "winning-bet" : ""
                } ${betId === "tour-example-bet" ? "tour-target-bet" : ""}`}
                id={betId === "tour-example-bet" ? "tour-claimable-bet" : ""}
              >
                <div className="bet-status">
                  <div className="bet-status-container">
                    <p className="bet-id">#{betId}</p>
                    <p
                      className={`status-badge ${
                        activeCategory === "claimable"
                          ? bet.match_state === "Error"
                            ? "status-error"
                            : "status-won"
                          : activeCategory === "pending"
                          ? "status-pending"
                          : outcomeClass
                      }`}
                    >
                      {activeCategory === "claimable"
                        ? bet.match_state === "Error"
                          ? "Refund Available"
                          : "Ready to Claim"
                        : activeCategory === "pending"
                        ? match_state
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
                        id={
                          betId === "tour-example-bet"
                            ? "tour-claim-button"
                            : ""
                        }
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
                      <span className="currency">USD</span>
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
                        // Display green only for actual winnings (won bets, claimed, or paid)
                        activeCategory === "claimable" ||
                        (activeCategory === "history" &&
                          (didBetWin(bet) ||
                            bet.pay_state === "Paid" ||
                            claimedBets[bet.betId]))
                          ? "won-value"
                          : "potential-value"
                      }`}
                    >
                      ${(potential_winnings / Math.pow(10, 6)).toFixed(2)}{" "}
                      <span className="currency">USD</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-bets-message">
            {showTourExampleForStep9 ? (
              <p>
                No bets found. This would normally show your claimable bets.
              </p>
            ) : (
              <>
                <p>No {activeCategory} bets found.</p>
                {activeCategory === "claimable" && isLoadingResults && (
                  <p className="loading-details">Checking match results...</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default UserBets;
