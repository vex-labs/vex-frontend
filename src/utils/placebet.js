import { handleTransaction } from "@/utils/accountHandler";

export async function placeBet(wallet, vexAccountId, matchId, team, betAmount, password) {
  const contractId = "sexyvexycontract.testnet";
  const tokenContractId = "usdc.betvex.testnet"; 

  try {
    // Retrieve password from local storage, if saved
    

    // Prepare the message for the bet
    const msg = JSON.stringify({
      Bet: {
        match_id: matchId,
        team: team,
      },
    });

    const gas = "100000000000000"; // 100 Tgas
    const deposit = "1"; // 1 yoctoNEAR

    if (vexAccountId) {
      const outcome = await handleTransaction(
        tokenContractId, // token contract
        "ft_transfer_call",
        {
          receiver_id: contractId,
          amount: betAmount,
          msg: msg,
        },
        gas,
        deposit,
        null, // No wallet object
        password 
      );
      console.log("Bet placed successfully using relayer with VEX account!", outcome);
      return outcome;
    } else if (wallet && wallet.selector) {
      // Use wallet directly if no vexAccountId is provided
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
      console.log("Bet placed successfully using wallet!", outcome);
      return outcome;
    } else {
      throw new Error("No valid wallet or VEX account ID available for placing a bet.");
    }
  } catch (error) {
    console.error("Failed to place bet:", error.message || error);
    throw error;
  }
}
