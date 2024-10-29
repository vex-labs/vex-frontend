"use client";

import React, { useEffect, useState, useMemo } from "react";
import { NearContext } from "@/app/context/NearContext";
import { Wallet } from "./wallet/Wallet";
import { NetworkId, GuestbookNearContract } from "./config";
import NavBar from "@/components/NavBar"; 
import "./globals.css";
import { providers, utils } from 'near-api-js';
import { handleCreateAccount, fetchAccountId } from "@/utils/accountHandler";
import VexLoginPrompt from "@/components/VexLoginPrompt";
import { Exo, Asap } from '@next/font/google';
import Head from 'next/head';
import { GlobalProvider } from "./context/GlobalContext";

const exo = Exo({
  subsets: ['latin'],
  weight: ['400', '700'], // adjust as needed
});

// Import Asap with desired weights
const asap = Asap({
  subsets: ['latin'],
  weight: ['400', '700'], // adjust as needed
});

export default function RootLayout({ children }) {
  const [signedAccountId, setSignedAccountId] = useState("");
  const [tokenBalances, setTokenBalances] = useState({});
  const [showVexLogin, setShowVexLogin] = useState(false); // Controls VexLoginPrompt visibility


  const tokenContracts = [
    
    { name: 'USDC', address: 'usdc.betvex.testnet' },
    { name: 'VEX', address: 'token.betvex.testnet' },
  ];

  // Memoize the NEAR wallet to prevent reinitializing on every render
  const wallet = useMemo(() => {
    return new Wallet({
      createAccessKeyFor: GuestbookNearContract,
      networkId: NetworkId,
    });
  }, []);

  useEffect(() => {
    const vexAccountId = localStorage.getItem("vexAccountId");
    
    // Check if `vexAccountId` is valid and ends with `.testnet`
    if (vexAccountId && vexAccountId.endsWith(".testnet")) {
      localStorage.setItem("isVexLogin", "true"); // Set isVexLogin to true
    } else {
      localStorage.setItem("isVexLogin", "false"); // Fallback for consistency
    }
  }, []);
  

  // Initialize NEAR wallet on component mount if not logged in with VEX
  useEffect(() => {
    const isVexLogin = localStorage.getItem('isVexLogin') === 'true';
    if (!isVexLogin) {
      wallet.startUp(setSignedAccountId);
    }
  }, [wallet]);

  useEffect(() => {
    const isVexLogin = localStorage.getItem("isVexLogin") === "true";
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
  }, [signedAccountId]);
    
  // Handle NEAR wallet login
  const handleLogin = () => {
    wallet.signIn();
  };

  // Handle NEAR wallet logout
  const handleLogout = async () => {
    await wallet.signOut();
    localStorage.removeItem("signedAccountId");
    setSignedAccountId("");
  };

  // Handle VEX login
  const handleVexLogin = async (username, password) => {
    const accountId = `${username}.testnet`;
    try {
      await handleCreateAccount(accountId, password);
      localStorage.setItem("isVexLogin", "true");
      localStorage.setItem("vexAccountId", accountId);
      if (password) localStorage.setItem("vexPassword", password);
      setSignedAccountId(accountId);
    } catch (error) {
      console.error("Failed to log in with VEX:", error);
    }
  };

  // Handle VEX logout
  const handleVexLogout = () => {
    localStorage.removeItem('vexPublicKey');
    localStorage.removeItem('vexPrivateKey');
    localStorage.setItem('isVexLogin', 'false');
  };

  useEffect(() => {
    const vexAccountId = localStorage.getItem("vexAccountId");
    if (vexAccountId) {
      const accountData = JSON.parse(localStorage.getItem(`near-account-${vexAccountId}`));
      if (accountData) {
        setSignedAccountId(accountData.accountId);
        setTokenBalances({ publicKey: accountData.publicKey }); // Use for displaying balance if needed
        console.log(accountData);
      }
    }
  }, []);

  useEffect(() => {
    console.log("showVexLogin state:", showVexLogin);
  }, [showVexLogin]);
  

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

        {localStorage.getItem("isVexLogin") === "true" ? (
          <>
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
          </>
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
            handleVexLogin={handleVexLogin} // Pass the login function
          />
        )}
      </body>
    </html>
  );
}