import { handleTransaction } from "@/utils/accountHandler";

/**
 * Places a bet on a specified match.
 * RETRIVE PASSWORD NEEDS TO BE CHECKED
 *
 * This function prepares and sends a transaction to place a bet on a specific match
 * using either a VEX account or a NEAR wallet.
 *
 * @param {string} matchId - The ID of the match to bet on
 * @param {string} team - The team to bet on
 * @param {string} betAmount - The amount to bet
 * @param {string} contractId - The ID of the contract to interact with
 * @param {string} tokenContractId - The ID of the token contract for the bet
 * @param {Object} wallet - The wallet instance to use for the transaction
 * @param {string} vexAccountId - The VEX account ID, if available
 * @param {string} password - The password for the VEX account, if saved
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
  vexAccountId,
  password,
) {
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
        password,
      );
      console.log(
        "Bet placed successfully using relayer with VEX account!",
        outcome,
      );
      return outcome;
    } else if (wallet && wallet.selector) {
      console.log("here");
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
      throw new Error(
        "No valid wallet or VEX account ID available for placing a bet.",
      );
    }
  } catch (error) {
    console.error("Failed to place bet:", error.message || error);
    throw error;
  }
}
