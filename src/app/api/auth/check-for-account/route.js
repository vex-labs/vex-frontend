import { NextResponse } from "next/server";
import { connectDB, dbConfig } from "@/lib/db";

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { publicKey } = body;

    if (!publicKey) {
      return NextResponse.json(
        { message: "Public key is required" },
        { status: 400 }
      );
    }

    try {
      const db = await connectDB();
      const collection = db.collection(dbConfig.collections.users);

      // Find user by public key
      const user = await collection.findOne({ public_key: publicKey });

      if (user) {
        return NextResponse.json({
          exists: true,
          accountId: user.account_id,
        });
      } else {
        return NextResponse.json({
          exists: false,
        });
      }
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          message: "Error checking account",
          error: error.message,
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
