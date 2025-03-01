import { connectDB, dbConfig } from "@/lib/db";
import { NextResponse } from "next/server";
// import { sendInitialFunds } from "@/app/api/auth/_lib/utils";

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { message: "Account ID is required" },
        { status: 400 }
      );
    }

    try {
      const db = await connectDB();
      const collection = db.collection(dbConfig.collections.users);

      // Check if user already exists
      const existingUser = await collection.findOne({ account_id: accountId });
      if (existingUser) {
        return NextResponse.json(
          { message: "User already exists" },
          { status: 200 }
        );
      }

      // Create the user document
      const userDoc = {
        account_id: accountId,
        username: accountId, // Username is same as account ID for wallet users
        leaderboard_on: true,
        recommended_matches_on: true,
        created_at: new Date(),
      };

      // Insert the user into the database
      const result = await collection.insertOne(userDoc);

      console.log(
        `Wallet user document created with _id: ${result.insertedId}`
      );

      // Send USDC and VEX to the new account
      // const sendingResult = await sendInitialFunds(accountId);

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
          accountId,
          dbId: result.insertedId,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          message: "Error creating wallet user",
          error: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json(
      { message: "Invalid request format" },
      { status: 400 }
    );
  }
}
