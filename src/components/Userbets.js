import React from 'react';

const UserBets = ({ userBets, wallet }) => {

  const handleClaim = async (betId) => {
    try {
      if (!wallet || !wallet.selector) {
        throw new Error("Wallet is not initialized");
      }

      const contractId = "sexyvexycontract.testnet";

      const args = {
        bet_id: betId,
      };

      console.log("Initiating claim...");

      // Call the claim function on the contract
      const outcome = await wallet.callMethod({
        contractId: contractId,
        method: "claim",
        args: {
          bet_id: betId,
        },
        gas: "100000000000000", // 100 Tgas
        deposit: "1", // 1 yoctoNEAR
      });

      console.log("Claim successful!", outcome);
      return outcome;
    } catch (error) {
      console.error("Failed to claim bet:", error.message || error);
      throw error;
    }
  };

  return (
    <section className="active-bets">
      <h2>Active Bets</h2>
      <ul>
        {userBets.length > 0 ? (
          userBets.map(([betId, bet], index) => (
            <li key={index} className="bet-item">
              <p><strong>Bet ID:</strong> {betId}</p>
              <p><strong>Match ID:</strong> {bet.match_id}</p>
              <p><strong>Team:</strong> {bet.team}</p>
              <p><strong>Bet Amount:</strong> {bet.bet_amount}</p>
              <p><strong>Potential Winnings:</strong> {bet.potential_winnings}</p>
              <p><strong>Pay State:</strong> {bet.pay_state ? bet.pay_state : 'Pending'}</p>

              {/* Only render Claim button if pay_state is not null */}
              {bet.pay_state && (
                <button className="claim-button" onClick={() => handleClaim(betId)}>
                  Claim
                </button>
              )}
            </li>
          ))
        ) : (
          <li>No bets found.</li>
        )}
      </ul>
    </section>
  );
};

export default UserBets;
