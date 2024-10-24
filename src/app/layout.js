"use client";

import React, { useEffect, useState, useMemo } from "react";
import { NearContext } from "@/app/context/NearContext";
import { Wallet } from "./wallet/Wallet";
import { NetworkId, GuestbookNearContract } from "./config";
import NavBar from "@/components/NavBar"; 
import { Inter } from "next/font/google";
import "./globals.css";
import { providers, utils } from 'near-api-js';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const [signedAccountId, setSignedAccountId] = useState("");
  const [tokenBalances, setTokenBalances] = useState({});
  const [vexKeyPair, setVexKeyPair] = useState(null); // Keypair for VEX login

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

  // Initialize NEAR wallet on component mount if not logged in with VEX
  useEffect(() => {
    const isVexLogin = localStorage.getItem('isVexLogin') === 'true';
    if (!isVexLogin) {
      wallet.startUp(setSignedAccountId);
    }
  }, [wallet]);

  useEffect(() => {
    const isVexLogin = localStorage.getItem('isVexLogin') === 'true';
    const accountId = isVexLogin ? localStorage.getItem('vexPublicKey') : signedAccountId;
  
  
    if (accountId) {
      const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");
  
      const fetchBalances = async () => {
        const balances = {};
  
        for (const token of tokenContracts) {
          try {
            if (token.name === 'NEAR') {
              // Fetch native NEAR balance using view_account request
              const accountBalance = await provider.query({
                request_type: "view_account",
                finality: "final",
                account_id: accountId,
              });
              
              const balanceInNear = utils.format.formatNearAmount(accountBalance.amount, 2);
              balances[token.name] = balanceInNear;
              
            } else {
              // Fetch token balances using ft_balance_of
              const args = { account_id: accountId };
              const result = await provider.query({
                request_type: "call_function",
                account_id: token.address, // Token contract address
                method_name: "ft_balance_of", 
                args_base64: Buffer.from(JSON.stringify(args)).toString('base64'), 
                finality: "final",
              });
  
              const balance = JSON.parse(Buffer.from(result.result).toString());
  
              // Formatting based on token decimals
              const decimals = token.name === 'USDC' ? 6 : (token.name === 'VEX' ? 18 : 24); // Adjust based on token's decimals
              const formattedBalance = (balance / Math.pow(10, decimals)).toFixed(2); 
              balances[token.name] = formattedBalance;
            }
          } catch (error) {
            console.error(`Failed to fetch balance for ${token.name}:`, error);
            balances[token.name] = '0';
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
  const handleVexLogin = () => {
    const hardcodedKeyPair = {
      publicKey: 'shuban.testnet', // Replace with actual key
      privateKey: 'ed25519:', // Replace with actual key
    };

    setVexKeyPair(hardcodedKeyPair);
    localStorage.setItem('vexPublicKey', hardcodedKeyPair.publicKey);
    localStorage.setItem('vexPrivateKey', hardcodedKeyPair.privateKey);
    localStorage.setItem('isVexLogin', 'true');
  };

  // Handle VEX logout
  const handleVexLogout = () => {
    setVexKeyPair(null);
    localStorage.removeItem('vexPublicKey');
    localStorage.removeItem('vexPrivateKey');
    localStorage.setItem('isVexLogin', 'false');
  };

  useEffect(() => {
    console.log('vexKeyPair in RootLayout:', vexKeyPair);
  }, [vexKeyPair]);

  return (
    <html lang="en">
      <body className={inter.className}>
        {localStorage.getItem('isVexLogin') === 'true' ? (
          <>
            <NavBar
              isLoggedIn={true}
              walletBalance={tokenBalances}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onVexLogin={handleVexLogin}
              onVexLogout={handleVexLogout}
              isVexLogin={true}
            />
            {children}
          </>
        ) : (
          <NearContext.Provider value={{ wallet, signedAccountId }}>
            <NavBar
              isLoggedIn={!!signedAccountId}
              walletBalance={tokenBalances}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onVexLogin={handleVexLogin}
              onVexLogout={handleVexLogout}
            />
            {children}
          </NearContext.Provider>
        )}
      </body>
    </html>
  );
}
