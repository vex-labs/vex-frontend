"use client";

import { useNear } from '@/app/context/NearContext';
import NavBar from '@/components/NavBar';
import { useEffect, useState } from 'react';
import { providers, utils } from 'near-api-js';

const UserPage = () => {
  const { signedAccountId } = useNear();
  const [walletBalance, setWalletBalance] = useState('');
  const [userBets, setUserBets] = useState([]);

  useEffect(() => {
    const fetchAccountBalance = async () => {
      if (signedAccountId) {
        try {
          console.log("Logged in with account:", signedAccountId);

          const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");

          // Fetch account balance
          const accountBalance = await provider.query({
            request_type: "view_account",
            finality: "final",
            account_id: signedAccountId,
          });

          console.log("Account Balance:", accountBalance);
          
          const balanceInNear = utils.format.formatNearAmount(accountBalance.amount, 2); // Convert to NEAR with 2 decimal places
          
          setWalletBalance(balanceInNear);
        } catch (error) {
          console.error("Failed to fetch account balance:", error);
        }
      }
    };

    const fetchUserBets = async () => {
      try {
        const contractId = "shocking-desire.testnet"; 

        // Call the get_users_bets function on the contract
        const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");
        const userBets = await provider.query({
          request_type: "call_function",
          account_id: contractId,
          method_name: "get_users_bets",
          // change bettor ID
          args_base64: btoa(JSON.stringify({ bettor: 'pivortex.testnet', from_index: null, limit: null })), 
          finality: "final"
        });

        
        const decodedResult = JSON.parse(Buffer.from(userBets.result).toString());

        console.log("User Bets:", decodedResult);

        
        setUserBets(decodedResult);
      } catch (error) {
        console.error("Failed to fetch user bets:", error);
      }
    };

    fetchAccountBalance();
    fetchUserBets();
  }, [signedAccountId]);

  return (
    <div>
      <NavBar 
        isLoggedIn={!!signedAccountId} 
        walletBalance={walletBalance} 
      />
      <div className="user-content">
        <h1>User Dashboard</h1>
        <h2>Your Bets</h2>
        <ul>
          {userBets.length > 0 ? (
            userBets.map(([betId, matchId], index) => (
              <li key={index}>
                Bet ID: {betId}, Match ID: {matchId}
              </li>
            ))
          ) : (
            <li>No bets found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default UserPage;