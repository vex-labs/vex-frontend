"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useNear } from "@/app/context/NearContext";
import NavBar from "@/components/NavBar";
import { providers, utils } from "near-api-js";
import { NearRpcUrl } from "@/app/config";

/**
 * AppLayout component
 *
 * Handles authentication state, token balances, and navigation
 * This component should wrap pages that require authentication or navigation
 *
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The child components to be rendered
 * @returns {JSX.Element} The rendered AppLayout component
 */
export default function AppLayout({ children }) {
  const { wallet, signedAccountId } = useNear();
  const [tokenBalances, setTokenBalances] = useState({});

  // List of token contracts with their names and addresses
  const tokenContracts = useMemo(
    () => [
      { name: "USDC", address: "usdc.betvex.testnet" },
      { name: "VEX", address: "token.betvex.testnet" },
    ],
    []
  );

  useEffect(() => {
    if (signedAccountId) {
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
                account_id: signedAccountId,
              });
              const balanceInNear = utils.format.formatNearAmount(
                accountBalance.amount,
                2
              );
              balances[token.name] = balanceInNear;
            } else {
              const args = { account_id: signedAccountId };
              const result = await provider.query({
                request_type: "call_function",
                account_id: token.address,
                method_name: "ft_balance_of",
                args_base64: Buffer.from(JSON.stringify(args)).toString(
                  "base64"
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
  }, [signedAccountId, tokenContracts]);

  const handleLogin = () => {
    wallet?.signIn();
  };

  const handleLogout = async () => {
    await wallet?.signOut();
    localStorage.removeItem("signedAccountId");
    localStorage.removeItem("near_signed_account_id");
  };

  return (
    <>
      <NavBar
        isLoggedIn={!!signedAccountId}
        walletBalance={tokenBalances}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      {children}
    </>
  );
}
