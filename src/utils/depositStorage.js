// src/utils/nearApi.js

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