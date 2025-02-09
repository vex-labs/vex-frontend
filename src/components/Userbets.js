import React, { useEffect, useState } from "react";
import { handleTransaction } from "@/utils/accountHandler";

/**
 * UserBets component
 *
 * This component displays the user's bets and allows them to claim their winnings.
 * It handles password submission if necessary and tracks successfully claimed bets.
 *
 * yet to test this component for wallet login
 * works with vex login
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
      const contractId = "sexyvexycontract.testnet";
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

  return (
    <section className="active-bets">
      <h2>Active Bets</h2>
      <ul>
        {userBets.length > 0 ? (
          userBets.map((bet, index) => {
            const {
              match_id,
              team,
              bet_amount,
              potential_winnings,
              match_state,
              betId,
            } = bet;
            const matchParts = match_id.split("-");
            const formattedMatchId = `${matchParts[0]} vs ${matchParts[1]}`;

            return (
              <li key={index} className="bet-item">
                <p>
                  <strong>Bet ID:</strong> {betId}
                </p>
                <p>
                  <strong>Match:</strong> {formattedMatchId}
                </p>
                <p>
                  <strong>Team:</strong> {team}
                </p>
                <p>
                  <strong>Bet Amount:</strong>{" "}
                  {(bet_amount / Math.pow(10, 6)).toFixed(2)} USDC
                </p>
                <p>
                  <strong>Potential Winnings:</strong>{" "}
                  {(potential_winnings / Math.pow(10, 6)).toFixed(2)} USDC
                </p>
                <p>
                  <strong>Pay State:</strong>{" "}
                  {bet.pay_state ? bet.pay_state : "Pending"}
                </p>

                {/* Render Claim button if match_state is not "Future" */}
                {match_state !== "Future" && !claimedBets[betId] && (
                  <button
                    className="claim-button"
                    onClick={() => handleClaim(betId)}
                  >
                    Claim
                  </button>
                )}

                {/* Display Claim Successful message if claim is successful */}
                {claimedBets[betId] && (
                  <p className="claim-successful-message">Claim Successful!</p>
                )}
              </li>
            );
          })
        ) : (
          <li>No bets found.</li>
        )}
      </ul>

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
