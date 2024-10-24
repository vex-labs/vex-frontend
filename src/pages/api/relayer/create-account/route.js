import { NextRequest, NextResponse } from "next/server";
import { createAccount } from '@near-relay/server'

export async function POST(req, res) {
    try {
        const { publicKey, accountId } = await req.json();

        const receipt = await createAccount(accountId, publicKey)

        return NextResponse.json(receipt, {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { msg: error.toString(), error },
            { headers: { "content-type": "application/json" }, status: 500 }
        );
    }
}