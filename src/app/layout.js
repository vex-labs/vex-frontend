"use client";

import React, { useEffect, useState, useMemo } from "react";
import { NearContext } from "@/app/context/NearContext";
import { Wallet } from "./wallet/Wallet";
import { NetworkId, GuestbookNearContract } from "./config";
import NavBar from "@/components/NavBar";
import "./globals.css";
import { providers, utils } from "near-api-js";
import { handleCreateAccount } from "@/utils/accountHandler";
import VexLoginPrompt from "@/components/VexLoginPrompt";
import { Exo, Asap } from "@next/font/google";
import Head from "next/head";
import { GlobalProvider } from "./context/GlobalContext";
import { NearRpcUrl } from "./config";

// Initialize fonts
const exo = Exo({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const asap = Asap({
  subsets: ["latin"],
  weight: ["400", "700"],
});

/**
 * RootLayout component
 *
 * This component serves as the root layout for the application and not a typical layput.js
 * This page uses "use client"
 * It provides the global context and manages the state for user authentication,
 * token balances, and the visibility of the Vex login prompt.
 *
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout
 *
 * @returns {JSX.Element} The rendered RootLayout component
 */

export default function RootLayout({ children }) {
  const [signedAccountId, setSignedAccountId] = useState("");
  const [tokenBalances, setTokenBalances] = useState({});
  const [showVexLogin, setShowVexLogin] = useState(false);
  const [isVexLogin, setIsVexLogin] = useState(null);

  // List of token contracts with their names and addresses
  const tokenContracts = [
    { name: "USDC", address: "usdc.betvex.testnet" },
    { name: "VEX", address: "token.betvex.testnet" },
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
      // Check if vexAccountId exists in localStorage and if it ends with ".testnet"
      const vexAccountId = localStorage.getItem("vexAccountId");
      const isVexLoginStatus =
        vexAccountId && vexAccountId.endsWith(".testnet");
      setIsVexLogin(isVexLoginStatus);

      // Set isVexLogin in localStorage based on the status
      if (isVexLoginStatus) {
        localStorage.setItem("isVexLogin", "true");
      } else {
        localStorage.setItem("isVexLogin", "false");
      }
    }
  }, []);

  useEffect(() => {
    // If not logged in via Vex, start up the wallet and set the signed account ID
    if (!isVexLogin) {
      wallet.startUp(setSignedAccountId);
    }
  }, [wallet, isVexLogin]);

  useEffect(() => {
    // Determine the account ID based on the login method
    const accountId = isVexLogin
      ? localStorage.getItem("vexAccountId")
      : signedAccountId;
    if (accountId) {
      // Initialize the NEAR RPC provider
      const provider = new providers.JsonRpcProvider(NearRpcUrl);

      // Function to fetch token balances
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
              const balanceInNear = utils.format.formatNearAmount(
                accountBalance.amount,
                2,
              );
              balances[token.name] = balanceInNear;
            } else {
              const args = { account_id: accountId };
              const result = await provider.query({
                request_type: "call_function",
                account_id: token.address,
                method_name: "ft_balance_of",
                args_base64: Buffer.from(JSON.stringify(args)).toString(
                  "base64",
                ),
                finality: "final",
              });

              const balance = JSON.parse(Buffer.from(result.result).toString());
              const decimals = token.name === "USDC" ? 6 : 18;
              const formattedBalance = (
                balance / Math.pow(10, decimals)
              ).toFixed(2);
              balances[token.name] = formattedBalance;
            }
          } catch (error) {
            console.error(`Failed to fetch balance for ${token.name}:`, error);
            balances[token.name] = "0";
          }
        }
        setTokenBalances(balances);
      };

      // Fetch balances when the component mounts or accountId changes
      fetchBalances();
    }
  }, [signedAccountId, isVexLogin, tokenContracts]);

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
    const accountId = `${username}.betvex.testnet`;
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
      const accountData = JSON.parse(
        localStorage.getItem(`near-account-${vexAccountId}`),
      );
      if (accountData) {
        setSignedAccountId(accountData.accountId);
        setTokenBalances({ publicKey: accountData.publicKey });
      }
    }
  }, []);

  return (
    <html
      lang="en"
      style={{
        "--font-primary": asap.style.fontFamily,
        "--font-heading": exo.style.fontFamily,
      }}
    >
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
