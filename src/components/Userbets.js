import React, { useEffect, useState } from "react";
import { handleTransaction } from "@/utils/accountHandler";
import { GuestbookNearContract } from "@/app/config";
import { DropdownMenu } from "radix-ui";

/**
 * UserBets component
 *
 * This component displays the user's bets and allows them to claim their winnings.
 * It handles password submission if necessary and tracks successfully claimed bets.
 * It categorizes bets by their status (claimable, error, pending, settled).
 *
 * @param {Object} props - The component props
 * @param {Array} props.userBets - Array of user's bet objects
 * @param {Object} props.wallet - Wallet object for handling transactions
 * @param {string} props.signedAccountId - The signed-in user's account ID
 *
 * @returns {JSX.Element} The rendered UserBets component
 */

const UserBets = ({ userBets, wallet, signedAccountId }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState(null);
  const [betToClaim, setBetToClaim] = useState(null);
  const [claimedBets, setClaimedBets] = useState({}); // Track successfully claimed bets
  const [activeCategory, setActiveCategory] = useState("claimable");

  useEffect(() => {
    const savedPassword = localStorage.getItem("vexPassword");
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  const handlePasswordSubmit = (enteredPassword) => {
    setPassword(enteredPassword);
    localStorage.setItem("vexPassword", enteredPassword);
    setShowPasswordModal(false);
    handleClaim(betToClaim, enteredPassword);
    localStorage.removeItem("vexPassword");
    setPassword(null);
  };

  const handleClaim = async (betId, enteredPassword = null) => {
    try {
      const isVexLogin =
        typeof window !== "undefined" &&
        localStorage.getItem("isVexLogin") === "true";
      const contractId = GuestbookNearContract;
      const gas = "100000000000000";
      const deposit = "1";

      const args = { bet_id: betId };

      if (isVexLogin) {
        const passwordToUse = enteredPassword || password;
        if (!passwordToUse) {
          setBetToClaim(betId);
          setShowPasswordModal(true);
          return;
        }

        const outcome = await handleTransaction(
          contractId,
          "claim",
          args,
          gas,
          deposit,
          null,
          passwordToUse,
        );

        console.log("Claim successful!", outcome);
        setClaimedBets((prev) => ({ ...prev, [betId]: true }));
        return outcome;
      } else if (wallet && wallet.selector) {
        const outcome = await wallet.callMethod({
          contractId: contractId,
          method: "claim",
          args,
          gas,
          deposit,
        });

        console.log("Claim successful!", outcome);
        setClaimedBets((prev) => ({ ...prev, [betId]: true }));
        return outcome;
      } else {
        throw new Error("Wallet is not initialized");
      }
    } catch (error) {
      console.error("Failed to claim bet:", error.message || error);
      alert("Claim Failed.");
      throw error;
    }
  };

  // Filter bets into categories
  const claimableBets = userBets.filter(
    (bet) =>
      bet.match_state === "Finished" &&
      !bet.pay_state &&
      !claimedBets[bet.betId],
  );

  const errorBets = userBets.filter(
    (bet) =>
      bet.match_state === "Error" && !bet.pay_state && !claimedBets[bet.betId],
  );

  const pendingBets = userBets.filter(
    (bet) => bet.match_state === "Future" || bet.match_state === "Current",
  );

  const settledBets = userBets.filter(
    (bet) =>
      bet.pay_state === "Paid" ||
      bet.pay_state === "RefundPaid" ||
      claimedBets[bet.betId],
  );

  // Get the current active bets based on selected category
  const getActiveBets = () => {
    switch (activeCategory) {
      case "claimable":
        return claimableBets;
      case "error":
        return errorBets;
      case "pending":
        return pendingBets;
      case "settled":
        return settledBets;
      default:
        return claimableBets;
    }
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
          Claimable {claimableBets.length > 0 && `(${claimableBets.length})`}
        </button>
        <button
          className={`tab-button ${
            activeCategory === "pending" ? "active" : ""
          }`}
          onClick={() => setActiveCategory("pending")}
        >
          Pending {pendingBets.length > 0 && `(${pendingBets.length})`}
        </button>
        <button
          className={`tab-button ${activeCategory === "error" ? "active" : ""}`}
          onClick={() => setActiveCategory("error")}
        >
          Error {errorBets.length > 0 && `(${errorBets.length})`}
        </button>
        <button
          className={`tab-button ${
            activeCategory === "settled" ? "active" : ""
          }`}
          onClick={() => setActiveCategory("settled")}
        >
          History
        </button>
      </div>
    );
  };

  return (
    <section className="active-bets">
      <h2>My Bets</h2>

      {renderTabs()}

      <div className="bet-container">
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
              " ",
            )} vs ${matchParts[1].replace("_", " ")}`;
            const isClaimable =
              (match_state === "Finished" || match_state === "Error") &&
              !bet.pay_state &&
              !claimedBets[betId];

            return (
              <div key={index} className="bet-item">
                <div className="bet-status">
                  <div className="bet-status-container">
                    <p>#{betId}</p>
                    <p
                      className={`status-bar ${
                        match_state === "Error" ? "status-error" : ""
                      }`}
                    >
                      {bet.pay_state ? bet.pay_state : match_state}
                    </p>
                  </div>
                  <div>
                    {isClaimable && (
                      <button
                        className="claim-button"
                        onClick={() => handleClaim(betId)}
                      >
                        {match_state === "Error" ? "Claim Refund" : "Claim"}
                      </button>
                    )}

                    {/* Display Claim Successful message if claim is successful */}
                    {claimedBets[betId] && (
                      <p className="claim-successful-message">
                        Claim Successful!
                      </p>
                    )}
                  </div>
                </div>
                <div className="bet-information">
                  <p className="match-id">{formattedMatchId}</p>
                  <p className="team-name">{team}</p>
                </div>
                <DropdownMenu.Separator className="DropdownMenuSeparator" />
                <div className="bet-amounts">
                  <div className="bet-amount-container">
                    <p className="">Bet Amount</p>
                    <p className="bet-numbers">
                      {(bet_amount / Math.pow(10, 6)).toFixed(2)} USDC
                    </p>
                  </div>
                  <div className="winings-amount-container">
                    <p>Potential Winnings</p>
                    <p className="bet-numbers">
                      {(potential_winnings / Math.pow(10, 6)).toFixed(2)} USDC
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-bets-message">No {activeCategory} bets found.</p>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Enter Password</h3>
            <input
              type="password"
              value={password || ""}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button onClick={() => handlePasswordSubmit(password)}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UserBets;
