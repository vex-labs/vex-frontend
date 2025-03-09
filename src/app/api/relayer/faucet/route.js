import { NextRequest, NextResponse } from "next/server";
import * as nearAPI from "near-api-js";

// If using App Router
export const dynamic = "force-dynamic";

// Configuration
const NearRpcUrl = process.env.NEAR_RPC_URL || "https://rpc.testnet.near.org";
const faucetId =
  process.env.FAUCET_CONTRACT_ID || "v2.faucet.nonofficial.testnet";

/**
 * API route to call a NEAR contract function
 */
export async function POST(req) {
  try {
    // Parse request body
    const body = await req.json();
    const { accountId, args } = body;

    if (!accountId || !args) {
      return NextResponse.json(
        { error: "Missing required parameters: accountId and args" },
        { status: 400 },
      );
    }

    // Validate environment variables
    if (!process.env.RELAYER_PRIVATE_KEY) {
      console.error("Missing RELAYER_PRIVATE_KEY environment variable");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Set up NEAR connection
    const myKeyStore = new nearAPI.keyStores.InMemoryKeyStore();
    const keyPair = nearAPI.KeyPair.fromString(process.env.RELAYER_PRIVATE_KEY);
    const relayerAccountId = process.env.RELAYER_ACCOUNT_ID;

    await myKeyStore.setKey("testnet", relayerAccountId, keyPair);

    const connectionConfig = {
      networkId: "testnet",
      keyStore: myKeyStore,
      nodeUrl: NearRpcUrl,
    };

    const nearConnection = await nearAPI.connect(connectionConfig);

    if (!relayerAccountId) {
      console.error("Missing RELAYER_ACCOUNT_ID environment variable");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const account = await nearConnection.account(relayerAccountId);

    // Call the contract function
    const res = await account.functionCall({
      contractId: faucetId,
      methodName: "ft_request_funds",
      args: args,
      gas: "100000000000000",
    });

    // Return the response
    return NextResponse.json({
      success: true,
      transactionHash: res.transaction.hash,
      result: res,
    });
  } catch (error) {
    console.error("Error calling NEAR function:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
