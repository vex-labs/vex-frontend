// src/utils/swapTokens.js
export async function swapTokens(wallet, swapDirection, tokenAmount) {
    const tokenContractId = swapDirection ? 'usdc.betvex.testnet' : 'token.betvex.testnet'; // Token to transfer
    const receiverId = 'ref-finance-101.testnet'; // Ref.Finance contract for swapping
    const poolId = 2197; // Ref.Finance pool for VEX-USDC
  
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
            token_out: swapDirection ? 'token.betvex.testnet' : 'usdc.betvex.testnet',
            amount_in: tokenAmount,
            amount_out: '0', // Set to '0' if you don't have an exact amount
            min_amount_out: '0', // Set to '0' for no slippage tolerance (or customize this)
          }
        ]
      });
  
      const gas = '100000000000000'; // 100 Tgas (Adjust gas if necessary)
      const deposit = '1'; // 1 yoctoNEAR is required for cross-contract calls
  
      console.log('Initiating token swap...');
  
      // Call ft_transfer_call on the token contract
      const outcome = await wallet.callMethod({
        contractId: tokenContractId,
        method: 'ft_transfer_call',
        args: {
          receiver_id: receiverId, // Ref.Finance contract to handle the swap
          amount: tokenAmount.toString(), // Ensure amount is passed as a string
          msg: msg, // The message for Ref.Finance pool with swap details
        },
        gas: gas,
        deposit: deposit, // 1 yoctoNEAR required for cross-contract calls
      });
  
      console.log('Token swap successful!', outcome);
      return outcome;
    } catch (error) {
      console.error('Failed to swap tokens:', error.message || error);
      throw error;
    }
  }
  