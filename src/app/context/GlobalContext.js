// src/app/context/GlobalContext.js
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { providers } from "near-api-js";
import { NearRpcUrl } from "../config";
import { useWeb3Auth } from "./Web3AuthContext";
import { useNear } from "./NearContext";

const GlobalContext = createContext();

/**
 * Custom hook to use the GlobalContext
 *
 * @returns {Object} The context value
 */
export const useGlobalContext = () => useContext(GlobalContext);

/**
 * GlobalProvider component
 *
 * This component provides global state and context to its children.
 * It manages token balances and provides a function to refresh balances.
 *
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The children components that will consume the context
 *
 * @returns {JSX.Element} The rendered GlobalProvider component
 */
export const GlobalProvider = ({ children }) => {
  const { web3auth, accountId: web3authAccountId } = useWeb3Auth();
  const { signedAccountId } = useNear();
  
  const [tokenBalances, setTokenBalances] = useState({ USDC: "0", VEX: "0" });
  const [refreshBalances, setRefreshBalances] = useState(false);

  // Wrap tokenContracts in useMemo to ensure it remains stable across renders
  const tokenContracts = useMemo(
    () => [
      { name: "USDC", address: "usdc.betvex.testnet" },
      { name: "VEX", address: "token.betvex.testnet" },
    ],
    []
  );

  const toggleRefreshBalances = () => {
    setRefreshBalances((prev) => !prev);
  };

  // Get the current active account ID - prefer Web3Auth, then fallback to NEAR wallet
  const accountId = useMemo(() => {
    // First check if Web3Auth is connected
    if (web3auth?.connected && web3authAccountId) {
      return web3authAccountId;
    }
    
    // Then check if NEAR wallet is connected
    if (signedAccountId) {
      return signedAccountId;
    }
    
    return null;
  }, [web3auth?.connected, web3authAccountId, signedAccountId]);

  useEffect(() => {
    if (accountId) {
      console.log("Fetching balances for account:", accountId);
      const provider = new providers.JsonRpcProvider(NearRpcUrl);

      const fetchBalances = async () => {
        const balances = {};
        for (const token of tokenContracts) {
          try {
            console.log(`Fetching balance for ${token.name}...`);
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
            const formattedBalance = (balance / Math.pow(10, decimals)).toFixed(
              2
            );
            balances[token.name] = formattedBalance;
            console.log(`Balance for ${token.name}: ${formattedBalance}`);
          } catch (error) {
            console.error(`Failed to fetch balance for ${token.name}:`, error);
            balances[token.name] = "0";
          }
        }
        console.log("Final fetched balances:", balances);
        setTokenBalances(balances);
      };

      fetchBalances();
    } else {
      console.log("Account ID not found.");
      setTokenBalances({ USDC: "0", VEX: "0" });
    }
  }, [accountId, refreshBalances, tokenContracts]); // tokenContracts is stable due to useMemo

  return (
    <GlobalContext.Provider value={{ 
      tokenBalances, 
      toggleRefreshBalances,
      accountId
    }}>
      {children}
    </GlobalContext.Provider>
  );
};
