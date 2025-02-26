import { NextRequest, NextResponse } from "next/server";
import { createSubAccount } from "@near-relay/server";
import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { connect, KeyPair } from "near-api-js";
import BN from "bn.js";
import { NearRpcUrl } from "@/app/config";

export async function POST(req) {
  try {
    const { publicKey, accountId } = await req.json(); // Parse JSON from request body
    const account = await getRelayerAccount();

    const receipt = await createSubAccount(accountId, publicKey);

    const usdcStorageReceipt = await account.functionCall({
      contractId: "usdc.betvex.testnet",
      methodName: "storage_deposit",
      args: { account_id: accountId },
      attachedDeposit: new BN("1250000000000000000000"), // 0.00125 NEAR
    });

    const tokenStorageReceipt = await account.functionCall({
      contractId: "token.betvex.testnet",
      methodName: "storage_deposit",
      args: { account_id: accountId },
      attachedDeposit: new BN("1250000000000000000000"), // 0.00125 NEAR
    });

    const transferReceipt = await account.functionCall({
      contractId: "usdc.betvex.testnet",
      methodName: "ft_transfer",
      args: {
        receiver_id: accountId,
        amount: "100000000",
      },
      attachedDeposit: new BN("1"),
    });

    return NextResponse.json(
      [receipt, usdcStorageReceipt, tokenStorageReceipt, transferReceipt],
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { msg: error.toString(), error },
      { headers: { "content-type": "application/json" }, status: 500 },
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

export async function GET() {
  return NextResponse.json(
    { message: "Create account endpoint is working!" },
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}
