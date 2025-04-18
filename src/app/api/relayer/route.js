import { NextRequest, NextResponse } from "next/server";
import { relay } from "@near-relay/server";

export async function POST(req, res) {
  try {
    const transaction = await req.json();
    const receipt = await relay(transaction);

    return NextResponse.json(receipt, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { msg: error.toString(), error },
      { headers: { "content-type": "application/json" }, status: 500 },
    );
  }
}
