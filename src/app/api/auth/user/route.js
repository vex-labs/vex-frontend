import { NextResponse } from "next/server";
import { connectDB, dbConfig } from "@/lib/db";

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { message: "Username is required" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    try {
      const collection = db.collection(dbConfig.collections.users);

      // Check if user exists in MongoDB
      const user = await collection.findOne({
        account_id: username,
      });

      if (!user) {
        return NextResponse.json(
          {
            message: "User not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          user,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Account check error details:", {
        error: error.message,
        stack: error.stack,
        type: error.type,
        cause: error.cause,
      });

      return NextResponse.json(
        {
          message: "Failed to check account",
          error: error.message,
          details: {
            errorType: error.type,
            errorCause: error.cause,
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
