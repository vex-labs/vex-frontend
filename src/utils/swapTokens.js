// src/utils/swapTokens.js

import {
  UsdcTokenContract,
  VexTokenContract,
  ReceiverId,
  PoolId,
} from "../app/config";

/**
 * Swaps tokens using the Ref.Finance contract.
 *
 * This function prepares and sends a transaction to swap tokens using the Ref.Finance contract.
 *
 * @param {Object} wallet - The wallet instance to use for the transaction
 * @param {boolean} swapDirection - The direction of the swap (true for USDC to VEX, false for VEX to USDC)
 * @param {string} tokenAmount - The amount of tokens to swap
 *
 * @returns {Promise<Object>} A promise that resolves to the transaction outcome
 */
export async function swapTokens(wallet, swapDirection, tokenAmount) {
  const CONFIG = {
    tokenContractIdUSDC: "usdc.betvex.testnet",
    tokenContractIdVEX: "token.betvex.testnet",
  };

  const tokenContractId = swapDirection
    ? CONFIG.tokenContractIdVEX
    : CONFIG.tokenContractIdUSDC; // Token to transfer
  const receiverId = ReceiverId; // Ref.Finance contract for swapping
  const poolId = PoolId;

  try {
    if (!wallet) {
      throw new Error("Wallet is not initialized.");
    }

    // Prepare the swap message for the token swap
    const msg = JSON.stringify({
      force: 0,
      actions: [
        {
          pool_id: poolId,
          token_in: tokenContractId,
          token_out: swapDirection ? UsdcTokenContract : VexTokenContract,
          amount_in: tokenAmount,
          amount_out: "0", // Set to '0' if you don't have an exact amount
          min_amount_out: "0", // Set to '0' for no slippage tolerance (or customize this)
        },
      ],
    });

    const gas = "100000000000000"; // 100 Tgas (Adjust gas if necessary)
    const deposit = "1"; // 1 yoctoNEAR is required for cross-contract calls

    console.log("Initiating token swap...");

    // Call ft_transfer_call on the token contract
    const outcome = await wallet.callMethod({
      contractId: tokenContractId,
      method: "ft_transfer_call",
      args: {
        receiver_id: receiverId,
        amount: tokenAmount,
        msg: msg,
      },
      gas,
      deposit,
    });

    console.log("Token swap successful!", outcome);
    return outcome;
  } catch (error) {
    console.error("Failed to swap tokens:", error);
    throw error;
  }
}
