"use client";

import Sidebar from '@/components/Sidebar';
import FeaturedGames from '@/components/FeaturedGames';
import UpcomingGames from '@/components/UpcomingGames';
import { useEffect, useState } from 'react';
import { providers } from 'near-api-js';
import FaucetSection from '@/components/Faucet';
import { fetchMatchesByIDs } from '@/utils/fetchMatches';

// Conditional useNear import
let useNear;
if (typeof window !== 'undefined') {
  useNear = require('@/app/context/NearContext').useNear;
}

export default function HomePage({ isVexLogin, vexKeyPair }) {
  const [matches, setMatches] = useState([]);
  const [additionalMatchData, setAdditionalMatchData] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  let signedAccountId = null;

  // Conditionally use NearContext only if not using VEX and ensure it doesn't throw errors
  if (!isVexLogin && useNear) {
    try {
      const nearContext = useNear();
      signedAccountId = nearContext?.signedAccountId || null;
    } catch (error) {
      console.error("Error accessing NearContext:", error);
    }
  }

  const handleGameSelection = (game) => {
    setSelectedGame(game);
  };

  // Determine if logged in with NEAR or VEX
  const accountId = isVexLogin ? vexKeyPair?.publicKey : signedAccountId;

  // Fetch matches from the blockchain (NEAR)
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const provider = new providers.JsonRpcProvider("https://rpc.testnet.near.org");
        const matches = await provider.query({
          request_type: "call_function",
          account_id: "sexyvexycontract.testnet",
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

  useEffect(() => {
    const fetchAdditionalMatchData = async () => {
      if (matches.length === 0) return;  // Don't fetch if there are no matches

      const matchIDs = matches.map(match => match.match_id).filter(Boolean);

      if (matchIDs.length === 0) return;

      const backendResponse = await fetchMatchesByIDs(matchIDs);
      console.log("Matches from backend:", backendResponse);

      setAdditionalMatchData(backendResponse);

      localStorage.setItem("additionalMatchData", JSON.stringify(backendResponse));
    };

    fetchAdditionalMatchData();
  }, [matches]);

  const filteredMatches = selectedGame 
    ? matches.filter((match) => match.game === selectedGame) 
    : matches;

  const filteredAdditionalData = additionalMatchData.filter((additionalMatch) => 
    filteredMatches.some((match) => match.match_id === additionalMatch.match_id)
  );

  return (
    <div className="container">
      <Sidebar onSelectGame={handleGameSelection} />
      <div className="mainContent">
        <FaucetSection className="faucet-section" />
        <div className="content-wrapper">
          <FeaturedGames matches={matches} />
          <UpcomingGames 
            matches={filteredMatches} 
            additionalMatchData={filteredAdditionalData}
          />
        </div>
      </div>
    </div>
  );
}
