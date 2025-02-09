// src/utils/nearApi.js

/**
 * Deposits storage for a specified account on a NEAR contract.
 *
 * This function calls the `storage_deposit` method on the specified contract
 * to deposit the required storage for the given account.
 *
 * @param {Object} wallet - The wallet instance to use for the transaction
 * @param {string} contractId - The ID of the contract to interact with
 * @param {string} accountId - The ID of the account to register for storage
 *
 * @returns {Promise<void>} A promise that resolves when the storage deposit is successful
 */
export async function depositStorage(wallet, contractId, accountId) {
  try {
    const minimumStorageBalance = "1250000000000000000000"; // 0.00125 NEAR in yoctoNEAR, adjust this based on contract requirements

    // Call the storage_deposit method to deposit the storage
    const outcome = await wallet.callMethod({
      contractId: contractId,
      method: "storage_deposit",
      args: {
        account_id: accountId, // Register the specified account
      },
      gas: "100000000000000", // 100 Tgas
      deposit: minimumStorageBalance, // Storage deposit amount
    });

    console.log("Storage deposited successfully!", outcome);
  } catch (error) {
    console.error("Failed to deposit storage:", error);
  }
}
