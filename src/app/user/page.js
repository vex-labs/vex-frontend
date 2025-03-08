"use client";
import { useEffect, useState } from "react";
import { providers } from "near-api-js";
import "./user.css";
import Sidebar2 from "@/components/Sidebar2";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { NearRpcUrl, VexContract } from "../config";
import UserBets from "@/components/Userbets";
import { useTour } from "@reactour/tour";

const UserPage = () => {
  const { accountId } = useGlobalContext();
  const { currentStep } = useTour();

  const [userBets, setUserBets] = useState([]);
  const [matchStates, setMatchStates] = useState({});

  useEffect(() => {
    const fetchUserBets = async () => {
      try {
        const contractId = VexContract;
        const args = {
          bettor: accountId,
          from_index: null,
          limit: null,
        };
        const provider = new providers.JsonRpcProvider(NearRpcUrl);
        const userBets = await provider.query({
          request_type: "call_function",
          account_id: contractId,
          method_name: "get_users_bets",
          args_base64: btoa(JSON.stringify(args)),
          finality: "final",
        });
        const decodedResult = JSON.parse(
          Buffer.from(userBets.result).toString()
        );
        const userBetsWithState = decodedResult.map(([betId, bet]) => {
          const matchState = matchStates[bet.match_id]?.match_state || null; // Add match state if available
          return {
            betId,
            ...bet,
            match_state: matchState, // Include the match state
          };
        });

        setUserBets(userBetsWithState);
      } catch (error) {
        console.error("Failed to fetch user bets:", error);
      }
    };

    if (accountId) {
      fetchUserBets();
    }
  }, [accountId, matchStates]);

  // New useEffect hook to fetch matches and store match states by match_id
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const provider = new providers.JsonRpcProvider(NearRpcUrl);
        const matches = await provider.query({
          request_type: "call_function",
          account_id: VexContract,
          method_name: "get_matches",
          args_base64: btoa(JSON.stringify({ from_index: null, limit: null })),
          finality: "final",
        });
        const decodedResult = JSON.parse(
          Buffer.from(matches.result).toString()
        );

        const states = {};
        decodedResult.forEach((match) => {
          states[match.match_id] = { match_state: match.match_state };
        });

        setMatchStates(states);
        localStorage.setItem("matches", JSON.stringify(decodedResult));
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      }
    };

    fetchMatches();
  }, []);

  // Important: Show the tour-specific UI even for non-logged in users when on step 9
  if (!accountId && currentStep !== 9) {
    return (
      <div className="user-page">
        <Sidebar2 />
        <div className="user-content not-logged-in">
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#fff", // Or any color you prefer
              textAlign: "center",
            }}
          >
            Please Login to access the user page
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="user-page">
      <Sidebar2 />
      <div className="user-content">
        <UserBets
          userBets={userBets}
          showTourExampleForStep9={currentStep === 9}
        />
      </div>
    </div>
  );
};

export default UserPage;
