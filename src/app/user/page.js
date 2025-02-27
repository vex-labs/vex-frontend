"use client";
import { useEffect, useState } from "react";
import { providers } from "near-api-js";
import "./user.css";
import Sidebar2 from "@/components/Sidebar2";
import { useNear } from "@/app/context/NearContext";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useGlobalContext } from "@/app/context/GlobalContext";
import { NearRpcUrl, VexContract } from "../config";
import UserBets from "@/components/Userbets";

const UserPage = () => {
  const { accountId } = useGlobalContext();
  const { wallet } = useNear();
  const { web3auth, nearConnection } = useWeb3Auth();

  const [userBets, setUserBets] = useState([]);
  const [matchStates, setMatchStates] = useState({});
  const [withdrawToken, setWithdrawToken] = useState("usdc.betvex.testnet");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");

  // No longer needed with Web3Auth

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
          Buffer.from(userBets.result).toString(),
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
          Buffer.from(matches.result).toString(),
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

  const handleWithdrawFunds = async () => {
    const decimals = withdrawToken === "token.betvex.testnet" ? 18 : 6;
    const formattedAmount = BigInt(
      parseFloat(withdrawAmount) * Math.pow(10, decimals),
    ).toString();
    const gas = "100000000000000"; // 100 TGas
    const deposit = "1"; // 1 yoctoNEAR

    try {
      // If using Web3Auth
      if (web3auth?.connected) {
        const account = await nearConnection.account(accountId);
        await account.functionCall({
          contractId: withdrawToken,
          methodName: "ft_transfer",
          args: {
            receiver_id: recipientAddress,
            amount: formattedAmount,
          },
          gas,
          attachedDeposit: deposit,
        });

        console.log("Withdrawal successful!");
        alert("Withdrawal Successful!");
      }
      // If using NEAR Wallet
      else {
        if (wallet) {
          const result = await wallet.callMethod({
            contractId: withdrawToken,
            method: "ft_transfer",
            args: {
              receiver_id: recipientAddress,
              amount: formattedAmount,
            },
            gas,
            deposit,
          });

          console.log("Withdrawal successful:", result);
          alert("Withdrawal Successful!");
        } else {
          throw new Error("Wallet not initialized");
        }
      }
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Withdrawal Failed.");
    }
  };

  if (!accountId) {
    return (
      <div className="user-page">
        <Sidebar2 />
        <div className="user-content">
          <h2
            style={{
              textAlign: "center",
              color: "var(--primary-color)",
              marginTop: "20%",
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
        <UserBets userBets={userBets} />
      </div>
    </div>
  );
};

export default UserPage;
