// src/app/context/GlobalContext.js
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { providers, utils } from 'near-api-js';

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
    const [tokenBalances, setTokenBalances] = useState({ USDC: '0', VEX: '0' });
    const [refreshBalances, setRefreshBalances] = useState(false);
    
    // Wrap tokenContracts in useMemo to ensure it remains stable across renders
    const tokenContracts = useMemo(() => [
        { name: 'USDC', address: 'usdc.betvex.testnet' },
        { name: 'VEX', address: 'token.betvex.testnet' }
    ], []);

    const toggleRefreshBalances = () => {
        setRefreshBalances((prev) => !prev);
    };

    useEffect(() => {
        const isVexLogin = localStorage.getItem("isVexLogin") === "true";
        const accountId = isVexLogin ? localStorage.getItem("vexAccountId") : localStorage.getItem("signedAccountId");

        if (accountId) {
            console.log("Fetching balances for account:", accountId);
            const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");

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
                        const formattedBalance = (balance / Math.pow(10, decimals)).toFixed(2);
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
        }
    }, [refreshBalances, tokenContracts]); // tokenContracts is stable due to useMemo

    return (
        <GlobalContext.Provider value={{ tokenBalances, toggleRefreshBalances }}>
            {children}
        </GlobalContext.Provider>
    );
};
