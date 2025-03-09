import { NearRpcUrl, NetworkId } from "@/app/config";
import { connect, keyStores, utils, transactions } from "near-api-js";
import { JsonRpcProvider } from "near-api-js/lib/providers";

/**
 * Fetch result from a NEAR contract view method
 *
 * @param {string} accountId - Contract account ID
 * @param {string} methodName - View method name to call
 * @param {object} args - Arguments to pass to the method
 * @returns {Promise<any>} - Parsed result from the view method
 */
async function fetchNearView(accountId, methodName, args) {
  const provider = new JsonRpcProvider({
    url: NearRpcUrl,
  });
  const argsBase64 = args
    ? Buffer.from(JSON.stringify(args)).toString("base64")
    : "";
  const viewCallResult = await provider.query({
    request_type: "call_function",
    account_id: accountId,
    args_base64: argsBase64,
    method_name: methodName,
    finality: "optimistic",
  });
  const resultBytes = viewCallResult.result;
  const resultString = String.fromCharCode(...resultBytes);
  return JSON.parse(resultString);
}

/**
 * Check if an account is registered with a token contract
 *
 * @param {string} tokenContract - Token contract ID
 * @param {string} accountId - Account to check
 * @returns {Promise<boolean>} - Whether the account is registered
 */
async function isAccountRegistered(tokenContract, accountId) {
  try {
    const storageBalance = await fetchNearView(
      tokenContract,
      "storage_balance_of",
      { account_id: accountId }
    );

    return (
      storageBalance !== null &&
      BigInt(storageBalance.total) >= BigInt("1250000000000000000000")
    );
  } catch (error) {
    console.error(
      `Error checking registration for ${accountId} with ${tokenContract}:`,
      error
    );
    return false;
  }
}

/**
 * Send initial funds to a user account with proper error handling and registration checks
 *
 * @param {string} accountId - Account ID to send funds to
 * @param {string} USDCamount - Amount of USDC to send (in yoctoNEAR)
 * @param {string} VEXamount - Amount of VEX to send (in yoctoNEAR)
 * @returns {Promise<object>} - Result of the operation
 */
export async function sendInitialFunds(
  accountId,
  USDCamount = "50000000",
  VEXamount = "1000000000000000000000"
) {
  try {
    const USDC_CONTRACT = "usdc.betvex.testnet";
    const VEX_CONTRACT = "token.betvex.testnet";
    const ACCOUNT_ID = "users.betvex.testnet";
    const PRIVATE_KEY = process.env.USERS_ACCOUNT_PRIVATE_KEY;

    if (!accountId) {
      throw new Error("Account ID is required");
    }

    if (!PRIVATE_KEY) {
      throw new Error("Private key is not configured");
    }

    // Set up NEAR connection
    const keyStore = new keyStores.InMemoryKeyStore();
    await keyStore.setKey(
      NetworkId,
      ACCOUNT_ID,
      utils.KeyPair.fromString(PRIVATE_KEY)
    );

    const connectionConfig = {
      networkId: NetworkId,
      keyStore,
      nodeUrl: NearRpcUrl,
    };

    const nearConnection = await connect(connectionConfig);
    const account = await nearConnection.account(ACCOUNT_ID);

    const results = {
      usdc: { registered: false, transferred: false },
      vex: { registered: false, transferred: false },
    };

    // Check USDC registration
    const isUsdcRegistered = await isAccountRegistered(
      USDC_CONTRACT,
      accountId
    );
    results.usdc.registered = isUsdcRegistered;

    // Check VEX registration
    const isVexRegistered = await isAccountRegistered(VEX_CONTRACT, accountId);
    results.vex.registered = isVexRegistered;

    // Handle USDC
    try {
      const usdcActions = [];

      // Add registration action if needed
      if (!isUsdcRegistered) {
        usdcActions.push(
          transactions.functionCall(
            "storage_deposit",
            { account_id: accountId },
            "30000000000000",
            "1250000000000000000000"
          )
        );
      }

      // Add transfer action
      usdcActions.push(
        transactions.functionCall(
          "ft_transfer",
          {
            receiver_id: accountId,
            amount: USDCamount,
          },
          "30000000000000",
          "1"
        )
      );

      // Execute USDC transaction(s)
      if (usdcActions.length > 0) {
        await account.signAndSendTransaction({
          receiverId: USDC_CONTRACT,
          actions: usdcActions,
        });
        results.usdc.transferred = true;
      }
    } catch (error) {
      console.error("USDC transaction error:", error);
      results.usdc.error = error.message;
    }

    // Handle VEX
    try {
      const vexActions = [];

      // Add registration action if needed
      if (!isVexRegistered) {
        vexActions.push(
          transactions.functionCall(
            "storage_deposit",
            { account_id: accountId },
            "30000000000000",
            "1250000000000000000000"
          )
        );
      }

      // Add transfer action
      vexActions.push(
        transactions.functionCall(
          "ft_transfer",
          {
            receiver_id: accountId,
            amount: VEXamount,
          },
          "30000000000000",
          "1"
        )
      );

      // Execute VEX transaction(s)
      if (vexActions.length > 0) {
        await account.signAndSendTransaction({
          receiverId: VEX_CONTRACT,
          actions: vexActions,
        });
        results.vex.transferred = true;
      }
    } catch (error) {
      console.error("VEX transaction error:", error);
      results.vex.error = error.message;
    }

    return {
      success: results.usdc.transferred || results.vex.transferred,
      message: "Funds sent successfully",
      details: results,
    };
  } catch (error) {
    console.error("Error sending initial funds:", error);
    return {
      success: false,
      message: error.message,
      error: error,
    };
  }
}
