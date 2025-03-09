// src/app/api/auth/register-token/route.js
import { JsonRpcProvider } from "near-api-js/lib/providers";
import { connect, keyStores, utils } from "near-api-js";
import { NextResponse } from "next/server";
import { NearRpcUrl } from "@/app/config";

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

export async function POST(request) {
  try {
    const body = await request.json();
    const { accountId, tokenContract } = body;

    if (!accountId || !tokenContract) {
      return NextResponse.json(
        { message: "Account ID and token contract are required" },
        { status: 400 }
      );
    }

    try {
      // First check if user is already registered
      const storageBalance = await fetchNearView(
        tokenContract,
        "storage_balance_of",
        { account_id: accountId }
      );

      // If balance meets minimum, user is already registered
      if (
        storageBalance !== null &&
        BigInt(storageBalance.total) >= BigInt("1250000000000000000000")
      ) {
        return NextResponse.json({
          message: "User already registered",
          registered: true,
        });
      }

      // User needs registration - set up relayer account
      const RELAYER_ACCOUNT_ID = process.env.RELAYER_ACCOUNT_ID;
      const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

      if (!RELAYER_ACCOUNT_ID || !RELAYER_PRIVATE_KEY) {
        throw new Error("Relayer account not configured");
      }

      // Set up NEAR connection
      const keyStore = new keyStores.InMemoryKeyStore();
      await keyStore.setKey(
        "testnet",
        RELAYER_ACCOUNT_ID,
        utils.KeyPair.fromString(RELAYER_PRIVATE_KEY)
      );

      const connectionConfig = {
        networkId: "testnet",
        keyStore,
        nodeUrl: NearRpcUrl,
      };

      const nearConnection = await connect(connectionConfig);
      const relayerAccount = await nearConnection.account(RELAYER_ACCOUNT_ID);

      // Register user
      await relayerAccount.functionCall({
        contractId: tokenContract,
        methodName: "storage_deposit",
        args: {
          account_id: accountId,
        },
        gas: BigInt("30000000000000"),
        attachedDeposit: BigInt("1250000000000000000000"),
      });

      return NextResponse.json({
        message: "Successfully registered user",
        registered: true,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return NextResponse.json(
        {
          message: "Failed to register user",
          error: error.message,
          registered: false,
        },
        { status: 500 }
      );
    }
  } catch (requestError) {
    console.error("Request parsing error:", requestError);
    return NextResponse.json(
      { message: "Invalid request format" },
      { status: 400 }
    );
  }
}
