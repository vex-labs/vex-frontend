import React from 'react';
import { handleTransaction } from "@/utils/accountHandler";

const UserBets = ({ userBets, wallet, signedAccountId }) => {

  const handleClaim = async (betId) => {
    try {
      const isVexLogin = typeof window !== 'undefined' && localStorage.getItem('isVexLogin') === 'true';
      const contractId = "sexyvexycontract.testnet";
      const gas = "100000000000000"; // 100 Tgas
      const deposit = "1"; // 1 yoctoNEAR

      const args = {
        bet_id: betId,
      };

      console.log("Initiating claim...");

      // Use handleTransaction if the user is logged in with VEX
      if (isVexLogin) {
        const password = localStorage.getItem("vexPassword");
        if (!password) {
          alert("Please enter your password to claim the bet.");
          return;
        }

        const outcome = await handleTransaction(
          contractId,
          "claim",
          args,
          gas,
          deposit,
          null, // No wallet for VEX login
          password
        );

        console.log("Claim successful!", outcome);
        alert("Claim Successful!");
        return outcome;

      } else if (wallet && wallet.selector) {
        // For regular NEAR wallet users, call claim directly on wallet
        const outcome = await wallet.callMethod({
          contractId: contractId,
          method: "claim",
          args,
          gas,
          deposit,
        });

        console.log("Claim successful!", outcome);
        alert("Claim Successful!");
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
          userBets.map(([betId, bet], index) => {
            // Split the match_id and format it as "team_a vs team_b"
            const matchParts = bet.match_id.split("-");
            const formattedMatchId = `${matchParts[0]} vs ${matchParts[1]}`;
  
            return (
              <li key={index} className="bet-item">
                <p><strong>Bet ID:</strong> {betId}</p>
                <p><strong>Match:</strong> {formattedMatchId}</p>
                <p><strong>Team:</strong> {bet.team}</p>
                <p><strong>Bet Amount:</strong> {(bet.bet_amount / Math.pow(10, 6)).toFixed(2)} USDC</p>
                <p><strong>Potential Winnings:</strong> {(bet.potential_winnings / Math.pow(10, 6)).toFixed(2)} USDC</p>
                <p><strong>Pay State:</strong> {bet.pay_state ? bet.pay_state : 'Pending'}</p>
  
                {/* Only render Claim button if pay_state is not null */}
                {bet.pay_state && (
                  <button className="claim-button" onClick={() => handleClaim(betId)}>
                    Claim
                  </button>
                )}
              </li>
            );
          })
        ) : (
          <li>No bets found.</li>
        )}
      </ul>
    </section>
  );
  
};

export default UserBets;
