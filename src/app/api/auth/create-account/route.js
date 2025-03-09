import { connect, keyStores, utils } from "near-api-js";
import { NextResponse } from "next/server";
import { connectDB, dbConfig } from "@/lib/db";
// import { sendInitialFunds } from "@/app/api/auth/_lib/utils";

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { username, publicKey } = body;

    if (!username || !publicKey) {
      return NextResponse.json(
        { message: "Username and public key are required" },
        { status: 400 }
      );
    }

    try {
      const keyStore = new keyStores.InMemoryKeyStore();
      const PRIVATE_KEY = process.env.USERS_ACCOUNT_PRIVATE_KEY;
      const ACCOUNT_ID = "users.betvex.testnet";

      await keyStore.setKey(
        "testnet",
        ACCOUNT_ID,
        utils.KeyPair.fromString(PRIVATE_KEY)
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

        console.log("Connecting to MongoDB");
        const db = await connectDB();
        console.log("Connected to MongoDB");

        const collection = db.collection(dbConfig.collections.users);

        // check if user exists
        const userExists = await collection.findOne({
          account_id: newAccountId,
        });

        if (userExists) {
          return NextResponse.json(
            {
              message: "User already exists",
              error: userExists.message || "User already exists",
              details: {
                accountId: newAccountId,
                publicKey,
                errorType: userExists.type,
                errorCause: userExists.cause,
              },
            },
            { status: 400 }
          );
        }

        // Create the NEAR account
        await account.createAccount(newAccountId, publicKey, "0");

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

        // Send USDC and VEX to the new account
        // const sendingResult = await sendInitialFunds(newAccountId);

        // if (!sendingResult.success) {
        //   return NextResponse.json(
        //     {
        //       message: "Failed to send initial funds",
        //       error: sendingResult.error,
        //     },
        //     { status: 500 }
        //   );
        // }

        return NextResponse.json(
          {
            accountId: newAccountId,
            dbId: result.insertedId,
          },
          { status: 201 }
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
          { status: 400 }
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
