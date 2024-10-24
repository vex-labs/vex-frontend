import { transactions, utils } from 'near-api-js';

/**
 * Handles token swap logic for VEX login.
 * @param {boolean} swapDirection - true for VEX -> USDC, false for USDC -> VEX.
 * @param {string} formattedAmount - The amount of tokens in smallest unit in yocto
 * @param {KeyPair} keyPair - The user's key pair 
 * @param {JsonRpcProvider} provider - NEAR provider 
 * @param {string} accountId - The account ID of the user 
 * @returns {Promise<object>} - The prepared transaction object.
 */
export async function swapTokensWithVexLogin(swapDirection, formattedAmount, keyPair, provider, accountId) {
  try {
    // Define the token contracts and other constants
    const tokenContractId = swapDirection ? 'usdc.betvex.testnet' : 'token.betvex.testnet'; // Token contract based on swap direction
    const receiverId = 'ref-finance-101.testnet'; // Ref.Finance contract for swapping
    const poolId = 2197; // Ref.Finance pool for VEX-USDC

    const msg = JSON.stringify({
      force: 0,
      actions: [
        {
          pool_id: poolId,
          token_in: swapDirection ? 'usdc.betvex.testnet' : 'token.betvex.testnet',
          token_out: swapDirection ? 'token.betvex.testnet' : 'usdc.betvex.testnet',
          amount_in: formattedAmount,
          amount_out: '0', // Set to '0' if no specific output expected
          min_amount_out: '1', // Set based on slippage tolerance
        },
      ],
    });

    const gas = '100000000000000'; // 100 Tgas
    const deposit = '1'; // 1 yoctoNEAR for cross-contract calls

    // Create the transfer call action
    const actions = [
      transactions.functionCall(
        'ft_transfer_call',
        {
          receiver_id: receiverId,
          amount: formattedAmount,
          msg: msg,
        },
        gas,
        deposit
      ),
    ];

    // Step 1: Get the public key from the keypair
    const publicKey = keyPair.getPublicKey();
    console.log("Public Key:", publicKey.toString());

    // Step 2: Query for the access key to get the current nonce and block hash
    const accessKey = await provider.query(
      `access_key/${accountId}/${publicKey.toString()}`,
      ""
    );

    // Log access key details for debugging
    console.log("Access Key Details:", JSON.stringify(accessKey, null, 2));

    // Step 3: Increment the nonce by 1, convert it to string
    const nonce = (BigInt(accessKey.nonce) + BigInt(1)).toString();
    console.log("Nonce for the transaction:", nonce.toString());

    // Step 4: Get the block hash from the access key and log it
    const blockHash = accessKey.block_hash;
    console.log("Raw Block Hash (base58):", blockHash);

    // Validate blockHash before decoding
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(blockHash)) {
      throw new Error("Invalid block hash format");
    }

    // Step 5: Decode the block hash
    let recentBlockHash;
    try {
      recentBlockHash = utils.serialize.base_decode(blockHash);
      console.log("Decoded Block Hash (Uint8Array):", recentBlockHash);
    } catch (err) {
      console.error("Error decoding block hash:", err.message);
      throw new Error('Failed to decode block hash');
    }

    // Step 6: Prepare the transaction object with the decoded block hash
    try {
      const transaction = transactions.createTransaction(
        accountId, // The signerId (account performing the transaction)
        publicKey, // The public key object with keyType and data
        tokenContractId, // The receiverId (contract to interact with)
        nonce.toString(), // The nonce for this access key (now in string format)
        actions, // The action (swap call)
        recentBlockHash // Pass the decoded block hash directly here
      );

      // Log the prepared transaction for further inspection
      console.log("Prepared Transaction:", transaction);

      return transaction;
    } catch (err) {
      console.error("Error preparing transaction:", err.message);
      throw new Error('Failed to prepare transaction');
    }

  } catch (error) {
    console.error('Failed to prepare swap transaction with Vex login:', error);
    throw new Error('Failed to prepare swap transaction');
  }
}
