'use client';

import Sidebar from '@/components/Sidebar';
import FeaturedGames from '@/components/FeaturedGames';
import UpcomingGames from '@/components/UpcomingGames';
import { useEffect, useState } from 'react';
import { providers } from 'near-api-js';
import { fetchMatchesByIDs } from '@/utils/fetchMatches';

let useNear;
if (typeof window !== 'undefined') {
  useNear = require('@/app/context/NearContext').useNear;
}

export default function HomePage({ isVexLogin, vexKeyPair }) {
  const [matches, setMatches] = useState([]);
  const [additionalMatchData, setAdditionalMatchData] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [vexAccountId, setVexAccountId] = useState(null); // Initialize vexAccountId with useState

  useEffect(() => {
    // Fetch vexAccountId from localStorage on component mount
    const storedVexAccountId = localStorage.getItem("vexAccountId");
    console.log("vexAccountId from local storage:", storedVexAccountId);
    setVexAccountId(storedVexAccountId); // Set the state with the stored value
  }, []);

  // Conditionally use NearContext only if not using VEX and ensure it doesn't throw errors
  let signedAccountId = null;
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
      if (matches.length === 0) return;

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
        <div className="content-wrapper">
          <FeaturedGames matches={matches} />
          
            <UpcomingGames 
              matches={filteredMatches} 
              additionalMatchData={filteredAdditionalData}
              vexAccountId={vexAccountId} // Pass updated vexAccountId as a prop
            />
          
        </div>
      </div>
    </div>
  );
}
