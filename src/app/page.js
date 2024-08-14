"use client";

import { useNear } from '@/app/context/NearContext';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import FeaturedGames from '@/components/FeaturedGames';
import UpcomingGames from '@/components/UpcomingGames';
import { useEffect, useState } from 'react';
import { providers, utils } from 'near-api-js';

export default function HomePage() {
  const { signedAccountId, wallet } = useNear();  // Use wallet from NearContext
  const [walletBalance, setWalletBalance] = useState('');
  const [matches, setMatches] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  const handleGameSelection = (game) => {
    setSelectedGame(game);
  };

  useEffect(() => {
    const fetchAccountBalance = async () => {
      if (signedAccountId) {
        try {
          console.log("Logged in with account:", signedAccountId);

          const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");

          const accountBalance = await provider.query({
            request_type: "view_account",
            finality: "final",
            account_id: signedAccountId,
          });

          console.log("Account Balance:", accountBalance);

          const balanceInNear = utils.format.formatNearAmount(accountBalance.amount, 2);

          setWalletBalance(balanceInNear);
        } catch (error) {
          console.error("Failed to fetch account balance:", error);
        }
      }
    };

    fetchAccountBalance();
  }, [signedAccountId]); 

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const contractId = "shocking-desire.testnet";

        const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");
        const matches = await provider.query({
          request_type: "call_function",
          account_id: contractId,
          method_name: "get_matches",
          args_base64: btoa(JSON.stringify({ from_index: null, limit: null })),
          finality: "final"
        });
        const decodedResult = JSON.parse(Buffer.from(matches.result).toString());

        console.log("Matches:", decodedResult);
        setMatches(decodedResult);

        localStorage.setItem("matches", JSON.stringify(decodedResult));
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      }
    };

    fetchMatches();
  }, []); 

  const filteredMatches = selectedGame 
    ? matches.filter((match) => match.game === selectedGame) 
    : matches;

  const handleLogin = () => {
    wallet.signIn();  
  };

  const handleLogout = () => {
    wallet.signOut();  
    window.location.reload();  // reload page after logout
  };

  return (
    <div className="container">
      <NavBar 
        isLoggedIn={!!signedAccountId} 
        walletBalance={walletBalance} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
      />
      <Sidebar onSelectGame={handleGameSelection} />
      <div className="mainContent">
        <FeaturedGames matches={matches} />
        <UpcomingGames matches={filteredMatches} />
      </div>
    </div>
  );
};