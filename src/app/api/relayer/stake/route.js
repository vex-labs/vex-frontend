import { NextResponse } from "next/server";
import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { connect, KeyPair } from "near-api-js";
import BN from "bn.js";
import { NearRpcUrl, VexContract } from "@/app/config";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { 
      userId, 
      amount 
    } = await req.json();

    if (!userId || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const account = await getRelayerAccount();
    const tokenContractId = "token.betvex.testnet";
    const stakingContractId = VexContract;

    // Convert amount to a fixed number with 2 decimal places, then to BigInt format
    const formattedAmount = BigInt(
      parseFloat(parseFloat(amount).toFixed(2)) * 1e18
    ).toString();
    
    const msg = JSON.stringify("Stake");

    // Call ft_transfer_call on the token contract
    const result = await account.functionCall({
      contractId: tokenContractId,
      methodName: "ft_transfer_call",
      args: {
        receiver_id: stakingContractId,
        amount: formattedAmount,
        msg: msg,
      },
      gas: "100000000000000",
      attachedDeposit: new BN("1"),
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
    console.error("Error in stake function:", error);
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