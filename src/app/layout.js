"use client";

import { useEffect, useState } from "react";
import { NearContext } from "@/app/context/NearContext";
import { Wallet } from "./wallet/Wallet";
import { NetworkId, GuestbookNearContract } from "./config";
import { Inter } from "next/font/google";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

const wallet = new Wallet({
  createAccessKeyFor: GuestbookNearContract,
  networkId: NetworkId,
});

export default function RootLayout({ children }) {
  const [signedAccountId, setSignedAccountId] = useState("");

  useEffect(() => {
    wallet.startUp(setSignedAccountId);
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <NearContext.Provider value={{ wallet, signedAccountId }}>
          {children}
        </NearContext.Provider>
      </body>
    </html>
  );
}
