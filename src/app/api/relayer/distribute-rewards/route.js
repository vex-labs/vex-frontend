import { NextResponse } from "next/server";
import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { connect, KeyPair } from "near-api-js";
import BN from "bn.js";
import { NearRpcUrl, VexContract } from "@/app/config";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required userId parameter" },
        { status: 400 }
      );
    }

    const account = await getRelayerAccount();
    const contractId = VexContract;

    // Call perform_stake_swap on the staking contract
    const result = await account.functionCall({
      contractId: contractId,
      methodName: "perform_stake_swap",
      args: {}, // No arguments required
      gas: "300000000000000", // 300 TGas
      attachedDeposit: new BN("0"),
    });

    return NextResponse.json({
      success: true,
      transactionHash: result.transaction.hash,
      result: result,
    }, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error in distribute rewards function:", error);
    return NextResponse.json(
      { error: error.toString() },
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

async function getRelayerAccount() {
  const relayerAccountId = process.env.RELAYER_ACCOUNT_ID || "";
  const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY || "";
  const network = process.env.NEAR_NETWORK || "testnet";

  const keyStore = new InMemoryKeyStore();
  await keyStore.setKey(
    network,
    relayerAccountId,
    KeyPair.fromString(relayerPrivateKey),
  );

  const config = {
    networkId: network,
    keyStore,
    nodeUrl: NearRpcUrl,
  };

  const near = await connect(config);
  return await near.account(relayerAccountId);
}