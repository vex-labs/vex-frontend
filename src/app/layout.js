"use client";

import React, { useEffect, useState, useMemo } from "react";
import { NearContext } from "@/app/context/NearContext";
import { Wallet } from "./wallet/Wallet";
import { NetworkId, GuestbookNearContract } from "./config";
import NavBar from "@/components/NavBar"; 
import "./globals.css";
import { providers, utils } from 'near-api-js';
import { handleCreateAccount } from "@/utils/accountHandler";
import VexLoginPrompt from "@/components/VexLoginPrompt";
import { Exo, Asap } from '@next/font/google';
import Head from 'next/head';
import { GlobalProvider } from "./context/GlobalContext";

const exo = Exo({
  subsets: ['latin'],
  weight: ['400', '700'],
});

const asap = Asap({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default function RootLayout({ children }) {
  const [signedAccountId, setSignedAccountId] = useState("");
  const [tokenBalances, setTokenBalances] = useState({});
  const [showVexLogin, setShowVexLogin] = useState(false);
  const [isVexLogin, setIsVexLogin] = useState(null); // New state to manage isVexLogin client-side

  const tokenContracts = [
    { name: 'USDC', address: 'usdc.betvex.testnet' },
    { name: 'VEX', address: 'token.betvex.testnet' },
  ];

  const wallet = useMemo(() => {
    return new Wallet({
      createAccessKeyFor: GuestbookNearContract,
      networkId: NetworkId,
    });
  }, []);

  // Fetch Vex login status only on the client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const vexAccountId = localStorage.getItem("vexAccountId");
      const isVexLoginStatus = vexAccountId && vexAccountId.endsWith(".testnet");
      setIsVexLogin(isVexLoginStatus);
      if (isVexLoginStatus) {
        localStorage.setItem("isVexLogin", "true");
      } else {
        localStorage.setItem("isVexLogin", "false");
      }
    }
  }, []);

  useEffect(() => {
    if (!isVexLogin) {
      wallet.startUp(setSignedAccountId);
    }
  }, [wallet, isVexLogin]);

  useEffect(() => {
    const accountId = isVexLogin ? localStorage.getItem("vexAccountId") : signedAccountId;
    if (accountId) {
      const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");

      const fetchBalances = async () => {
        const balances = {};
        for (const token of tokenContracts) {
          try {
            if (token.name === "NEAR") {
              const accountBalance = await provider.query({
                request_type: "view_account",
                finality: "final",
                account_id: accountId,
              });
              const balanceInNear = utils.format.formatNearAmount(accountBalance.amount, 2);
              balances[token.name] = balanceInNear;
            } else {
              const args = { account_id: accountId };
              const result = await provider.query({
                request_type: "call_function",
                account_id: token.address,
                method_name: "ft_balance_of",
                args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
                finality: "final",
              });

              const balance = JSON.parse(Buffer.from(result.result).toString());
              const decimals = token.name === "USDC" ? 6 : 18;
              const formattedBalance = (balance / Math.pow(10, decimals)).toFixed(2);
              balances[token.name] = formattedBalance;
            }
          } catch (error) {
            console.error(`Failed to fetch balance for ${token.name}:`, error);
            balances[token.name] = "0";
          }
        }
        setTokenBalances(balances);
      };

      fetchBalances();
    }
  }, [signedAccountId, isVexLogin]);

  const handleLogin = () => {
    wallet.signIn();
  };

  const handleLogout = async () => {
    await wallet.signOut();
    localStorage.removeItem("signedAccountId");
    setSignedAccountId("");
  };

  const handleVexLogin = async (username, password) => {
    // Add ".betvex.testnet" to the username input
    const accountId = `${username}.shunab.testnet`;
    try {
      await handleCreateAccount(accountId, password);
      localStorage.setItem("isVexLogin", "true");
      localStorage.setItem("vexAccountId", accountId);
      if (password) localStorage.setItem("vexPassword", password);
      setSignedAccountId(accountId);
      setIsVexLogin(true); // Update state after successful Vex login
    } catch (error) {
      console.error("Failed to log in with VEX:", error);
    }
  };
  

  const handleVexLogout = () => {
    // Remove all keys that start with "near-account-"
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("near-account-")) {
        localStorage.removeItem(key);
      }
    });
  
    // Remove vex-specific localStorage items
    localStorage.removeItem("isVexLogin");
    localStorage.removeItem("vexAccountId");
    localStorage.removeItem("vexPassword");
  
    setIsVexLogin(false); // Update state after logout
  
    // Reload the page to ensure the state resets completely
    window.location.reload();
  };

  useEffect(() => {
    const vexAccountId = localStorage.getItem("vexAccountId");
    if (vexAccountId) {
      const accountData = JSON.parse(localStorage.getItem(`near-account-${vexAccountId}`));
      if (accountData) {
        setSignedAccountId(accountData.accountId);
        setTokenBalances({ publicKey: accountData.publicKey });
      }
    }
  }, []);

  return (
    <html lang="en"
      style={{
        "--font-primary": asap.style.fontFamily,
        "--font-heading": exo.style.fontFamily,
      }}>
      <Head>
        <title>BetVex | App</title>
        <meta name="description" content="BetVex Esports by Vex Labs" />
      </Head>
      <body className={asap.className}>
        {isVexLogin ? (
          <GlobalProvider>
            <NavBar
              isLoggedIn={true}
              walletBalance={tokenBalances}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onVexLogin={() => setShowVexLogin(true)}
              onVexLogout={handleVexLogout}
              isVexLogin={true}
            />
            {children}
          </GlobalProvider>
        ) : (
          <GlobalProvider>
            <NearContext.Provider value={{ wallet, signedAccountId }}>
              <NavBar
                isLoggedIn={!!signedAccountId}
                walletBalance={tokenBalances}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onVexLogin={() => setShowVexLogin(true)}
                onVexLogout={handleVexLogout}
              />
              {children}
            </NearContext.Provider>
          </GlobalProvider>
        )}
        {showVexLogin && (
          <VexLoginPrompt
            onLoginSuccess={(accountId) => {
              setShowVexLogin(false);
              setSignedAccountId(accountId);
            }}
            handleVexLogin={handleVexLogin}
          />
        )}
      </body>
    </html>
  );
}
