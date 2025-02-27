import { connect, keyStores, utils } from "near-api-js";
import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import dbConfig from "@/db-config";

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { username, publicKey } = body;

    if (!username || !publicKey) {
      return NextResponse.json(
        { message: "Username and public key are required" },
        { status: 400 },
      );
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
      const keyStore = new keyStores.InMemoryKeyStore();
      const PRIVATE_KEY = process.env.USERS_ACCOUNT_PRIVATE_KEY;
      const ACCOUNT_ID = "users.betvex.testnet";

      await keyStore.setKey(
        "testnet",
        ACCOUNT_ID,
        utils.KeyPair.fromString(PRIVATE_KEY),
      );

      const connectionConfig = {
        networkId: "testnet",
        keyStore,
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
      };

      const nearConnection = await connect(connectionConfig);
      const account = await nearConnection.account(ACCOUNT_ID);

      // Create the new account
      const newAccountId = `${username}.users.betvex.testnet`;

      try {
        console.log("Attempting to create account:", {
          newAccountId,
          publicKey,
          parentAccount: ACCOUNT_ID,
        });

        // Create the NEAR account
        await account.createAccount(newAccountId, publicKey, "0");

        console.log("Connecting to MongoDB");
        // Connect to MongoDB and create user entry
        await client.connect();

        console.log("Connected to MongoDB");

        const db = client.db(dbConfig.dbName);
        const collection = db.collection(dbConfig.collections.users);

        // Create the user document
        const userDoc = {
          account_id: newAccountId,
          username: username,
          leaderboard_on: true,
          recommended_matches_on: true,
          public_key: publicKey,
          created_at: new Date(),
        };

        // Insert the user into the database
        const result = await collection.insertOne(userDoc);
        console.log(`User document created with _id: ${result.insertedId}`);

        return NextResponse.json(
          {
            accountId: newAccountId,
            dbId: result.insertedId,
          },
          { status: 201 },
        );
      } catch (createError) {
        console.error("Account creation error details:", {
          error: createError.message,
          stack: createError.stack,
          type: createError.type,
          cause: createError.cause,
        });

        return NextResponse.json(
          {
            message: "Failed to create account",
            error: createError.message,
            details: {
              accountId: newAccountId,
              publicKey,
              errorType: createError.type,
              errorCause: createError.cause,
            },
          },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error("Connection setup error details:", {
        error: error.message,
        stack: error.stack,
        type: error.type,
        cause: error.cause,
      });

      return NextResponse.json(
        {
          message: "Failed to create account",
          error: error.message,
          details: {
            errorType: error.type,
            errorCause: error.cause,
            phase: "connection setup",
          },
        },
        { status: 500 },
      );
    } finally {
      await client.close();
    }
  } catch (requestError) {
    console.error("Request parsing error:", requestError);
    return NextResponse.json(
      { message: "Invalid request format" },
      { status: 400 },
    );
  }
}
