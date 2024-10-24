export async function placeBet(wallet, matchId, team, betAmount) {
  const contractId = "sexyvexycontract.testnet";
  const tokenContractId = "usdc.betvex.testnet"; 

  try {
    if (!wallet || !wallet.selector) {
      throw new Error("Wallet is not initialized");
    }

    // Prepare the message for the bet (adjusted for the FtTransferAction::Bet variant)
    const msg = JSON.stringify({
      Bet: {
        match_id: matchId,
        team: team,
      },
    });

    const gas = "100000000000000"; // 100 Tgas
    const deposit = "1"; // 1 yoctoNEAR

    console.log("Initiating token transfer...");

    // Call ft_transfer_call on the token contract
    const outcome = await wallet.callMethod({
      contractId: tokenContractId,
      method: "ft_transfer_call",
      args: {
        receiver_id: contractId, // The contract that will handle ft_on_transfer
        amount: betAmount, // The amount of tokens to transfer (in yocto units)
        msg: msg, // The message to pass to the receiving contract (now correctly structured)
      },
      gas: gas,
      deposit: deposit, // Usually 1 yoctoNEAR
    });

    console.log("Token transfer and bet placement successful!", outcome);
    return outcome;
  } catch (error) {
    console.error("Failed to place bet:", error.message || error);
    throw error;
  }
}
