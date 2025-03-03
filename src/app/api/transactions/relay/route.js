import { NextResponse } from "next/server";
import { Account, connect, KeyPair } from "near-api-js";
import { SCHEMA, SignedDelegate, actionCreators } from "@near-js/transactions";
import { keyStores } from "near-api-js";
import { NearRpcUrl, NetworkId } from "@/app/config";
import { deserialize } from "borsh";

export async function POST(request) {
  try {
    const serializedTxs = await request.json(); // This will be an array of transactions

    // Set up connection to NEAR
    const keyStore = new keyStores.InMemoryKeyStore();
    const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
    const RELAYER_ACCOUNT_ID = process.env.RELAYER_ACCOUNT_ID;

    // Add the relayer's key to the keystore
    await keyStore.setKey(
      NetworkId,
      RELAYER_ACCOUNT_ID,
      KeyPair.fromString(RELAYER_PRIVATE_KEY)
    );

    const connectionConfig = {
      networkId: NetworkId,
      keyStore,
      nodeUrl: NearRpcUrl,
      walletUrl: `https://wallet.${NetworkId}.near.org`,
      helperUrl: `https://helper.${NetworkId}.near.org`,
      explorerUrl: `https://explorer.${NetworkId}.near.org`,
    };

    // Connect to NEAR and get the relayer account
    const nearConnection = await connect(connectionConfig);
    const relayerAccount = await nearConnection.account(RELAYER_ACCOUNT_ID);

    // Process all transactions in the array
    const outcomes = await Promise.all(
      serializedTxs.map(async (serializedTx) => {
        const deserializedTx = deserialize(
          SCHEMA.SignedDelegate,
          Buffer.from(serializedTx)
        );

        return await relayerAccount.signAndSendTransaction({
          actions: [actionCreators.signedDelegate(deserializedTx)],
          receiverId: deserializedTx.delegateAction.senderId,
        });
      })
    );

    return NextResponse.json(
      {
        message: "Relayed",
        data: outcomes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Relay transaction error:", error);
    return NextResponse.json(
      {
        message: "Failed to relay transaction",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
