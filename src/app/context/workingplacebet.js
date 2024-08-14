// src/utils/nearApi.js
export async function placeBet(wallet, matchId, team, betAmount) {
    const contractId = "shocking-desire.testnet";
    const tokenContractId = "cusd.fakes.testnet"; 
  
    try {
      const gas = "100000000000000"; // 100 Tgas
      const deposit = "1"; // 1 yoctoNEAR
  
      // message for the bet
      const msg = JSON.stringify({
        match_id: matchId,
        team: team,
      });
  
      // Call signAndSendTransaction method
      const outcome = await wallet.callMethod({
        contractId: tokenContractId,
        method: "ft_transfer_call",
        args: {
          receiver_id: contractId,
          amount: betAmount,
          msg: msg,
        },
        gas: gas,
        deposit: deposit,
      });
  
      console.log("Bet placed successfully!", outcome);
    } catch (error) {
      console.error("Failed to place bet:", error);
    }
  }