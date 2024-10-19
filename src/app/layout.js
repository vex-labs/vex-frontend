"use client";

import { useEffect, useState, useMemo } from "react";
import { NearContext } from "@/app/context/NearContext";
import { Wallet } from "./wallet/Wallet";
import { NetworkId, GuestbookNearContract } from "./config";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const [signedAccountId, setSignedAccountId] = useState("");

  // Memoize the wallet to prevent reinitializing on every render
  const wallet = useMemo(() => {
    return new Wallet({
      createAccessKeyFor: GuestbookNearContract,
      networkId: NetworkId,
    });
  }, []); // Only create the wallet once

  // Initialize wallet on component mount (no localStorage)
  useEffect(() => {
    wallet.startUp(setSignedAccountId);
  }, [wallet]);

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
