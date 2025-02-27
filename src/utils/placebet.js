/**
 * Places a bet on a specified match.
 *
 * This function prepares and sends a transaction to place a bet on a specific match
 * using either Web3Auth or a NEAR wallet.
 *
 * @param {string} matchId - The ID of the match to bet on
 * @param {string} team - The team to bet on
 * @param {string} betAmount - The amount to bet
 * @param {string} contractId - The ID of the contract to interact with
 * @param {string} tokenContractId - The ID of the token contract for the bet
 * @param {Object} wallet - The NEAR wallet instance to use for the transaction
 * @param {string} web3authAccountId - The Web3Auth account ID, if available
 * @param {Object} nearConnection - The NEAR connection for Web3Auth transactions
 *
 * @returns {Promise<Object>} A promise that resolves to the transaction outcome
 */
export async function placeBet(
  matchId,
  team,
  betAmount,
  contractId,
  tokenContractId,
  wallet,
  web3authAccountId,
  nearConnection,
) {
  try {
    // Prepare the message for the bet
    const msg = JSON.stringify({
      Bet: {
        match_id: matchId,
        team: team,
      },
    });

    const gas = "100000000000000"; // 100 Tgas
    const deposit = "1"; // 1 yoctoNEAR

    // If using Web3Auth
    if (web3authAccountId && nearConnection) {
      const account = await nearConnection.account(web3authAccountId);
      const outcome = await account.functionCall({
        contractId: tokenContractId,
        methodName: "ft_transfer_call",
        args: {
          receiver_id: contractId,
          amount: betAmount,
          msg: msg,
        },
        gas,
        attachedDeposit: deposit,
      });

      console.log("Bet placed successfully using Web3Auth!", outcome);
      return outcome;
    }
    // If using NEAR Wallet
    else if (wallet) {
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
      console.log("Bet placed successfully using NEAR wallet!", outcome);
      return outcome;
    } else {
      throw new Error(
        "No valid wallet or Web3Auth account available for placing a bet.",
      );
    }
  } catch (error) {
    console.error("Failed to place bet:", error.message || error);
    throw error;
  }
}
