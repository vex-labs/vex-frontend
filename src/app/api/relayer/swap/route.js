import { NextResponse } from "next/server";
import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { connect, KeyPair } from "near-api-js";
import BN from "bn.js";
import { NearRpcUrl, ReceiverId, PoolId } from "@/app/config";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { 
      userId, 
      swapDirection, 
      formattedAmount, 
      minAmountOut = "0" 
    } = await req.json();

    if (!userId || formattedAmount === undefined || swapDirection === undefined) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const account = await getRelayerAccount();

    const sourceTokenId = swapDirection
      ? "token.betvex.testnet"
      : "usdc.betvex.testnet";
    const targetTokenId = swapDirection
      ? "usdc.betvex.testnet"
      : "token.betvex.testnet";

    // Prepare the swap message for the token swap
    const msg = JSON.stringify({
      force: 0,
      actions: [
        {
          pool_id: PoolId,
          token_in: sourceTokenId,
          token_out: targetTokenId,
          amount_in: formattedAmount,
          amount_out: "0",
          min_amount_out: minAmountOut,
        },
      ],
    });

    // Call ft_transfer_call on the token contract
    const result = await account.functionCall({
      contractId: sourceTokenId,
      methodName: "ft_transfer_call",
      args: {
        receiver_id: ReceiverId,
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
    console.error("Error in swap function:", error);
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